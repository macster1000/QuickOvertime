import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { Role, Status, RequestType } from "@prisma/client";

export async function GET(request: NextRequest) {
  // 1. Authorize the user (Admins only)
  const session = await getSession();
  if (!session || session.role !== Role.ADMIN) {
    return new Response("Nicht autorisiert.", { status: 401 });
  }

  // 2. Parse query parameters
  const { searchParams } = new URL(request.url);
  const monthParam = searchParams.get("month"); // Format: YYYY-MM
  
  let startDate: Date;
  let endDate: Date;

  if (monthParam && /^\d{4}-\d{2}$/.test(monthParam)) {
    const [year, month] = monthParam.split("-").map(Number);
    startDate = new Date(year, month - 1, 1);
    endDate = new Date(year, month, 0, 23, 59, 59, 999);
  } else {
    // Default to current month
    const now = new Date();
    startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
  }

  const yearStr = startDate.getFullYear();
  const monthStr = String(startDate.getMonth() + 1).padStart(2, "0");
  const monthLabel = `${yearStr}-${monthStr}`;

  try {
    // 3. Fetch approved requests in range
    const requests = await db.request.findMany({
      where: {
        status: Status.APPROVED,
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        employee: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        date: "asc",
      },
    });

    // 4. Generate CSV content
    // We add a BOM (Byte Order Mark) so Excel opens it automatically as UTF-8 with correct German Umlauts
    const BOM = "\uFEFF";
    
    // Header line
    const headers = ["Mitarbeiterin", "Datum", "Typ", "Stunden", "Begründung", "Eingereicht Am"].join(";");
    
    const rows = requests.map((req) => {
      const formattedDate = req.date.toLocaleDateString("de-DE", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });

      const formattedCreatedAt = req.createdAt.toLocaleDateString("de-DE", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });

      const typeLabelMap: Record<string, string> = {
        OVERTIME: "Überstunden",
        COMPENSATION: "Freizeitausgleich",
        VACATION: "Urlaub",
        OVERTIME_REDUCTION: "Überstundenabbau",
      };
      const typeLabel = typeLabelMap[req.type] || req.type;
      
      // German number format: e.g. 1.5 -> "1,5" or -2 -> "-2,00"
      // Compensation and OvertimeReduction exported as negative hours for easy DATEV/Excel calculations
      const signedHours = (req.type === RequestType.COMPENSATION || req.type === RequestType.OVERTIME_REDUCTION)
        ? -req.hours
        : req.hours;
      const formattedHours = signedHours.toFixed(2).replace(".", ",");
      
      // Escape quotes and semi-colons in text fields to prevent CSV injection
      const escapedReason = req.reason.replace(/"/g, '""').replace(/;/g, ",");

      return [
        `"${req.employee.name}"`,
        `"${formattedDate}"`,
        `"${typeLabel}"`,
        `"${formattedHours}"`,
        `"${escapedReason}"`,
        `"${formattedCreatedAt}"`,
      ].join(";");
    });

    const csvContent = BOM + [headers, ...rows].join("\n");

    // 5. Return download response
    return new Response(csvContent, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="QuickOvertime_Export_${monthLabel}.csv"`,
      },
    });
  } catch (error) {
    console.error("CSV Export error:", error);
    return new Response("Interner Serverfehler beim Generieren des Exports.", { status: 500 });
  }
}
