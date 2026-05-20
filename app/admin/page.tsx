import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { logoutAction } from "@/lib/actions";
import { Role, Status, RequestType } from "@prisma/client";
import { redirect } from "next/navigation";
import PendingQueue from "./PendingQueue";
import EmployeeManager from "./EmployeeManager";
import ExportSection from "./ExportSection";
import CalendarView from "./CalendarView";
import AdminTabs from "./AdminTabs";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const session = await getSession();

  if (!session || session.role !== Role.ADMIN) {
    redirect("/login");
  }

  // 1. Fetch pending requests (inbox queue)
  const pendingRequests = await db.request.findMany({
    where: { status: Status.PENDING },
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

  // 2. Fetch all employees and compute active balances
  const employeesList = await db.employee.findMany({
    where: { role: Role.EMPLOYEE },
    include: {
      requests: {
        where: { status: Status.APPROVED },
      },
    },
    orderBy: {
      name: "asc",
    },
  });

  const employeesWithBalances = employeesList.map((emp) => {
    const plus = emp.requests
      .filter((r) => r.type === RequestType.OVERTIME)
      .reduce((sum, r) => sum + r.hours, 0);
    const minus = emp.requests
      .filter((r) => r.type === RequestType.COMPENSATION || r.type === RequestType.OVERTIME_REDUCTION)
      .reduce((sum, r) => sum + r.hours, 0);
    
    return {
      id: emp.id,
      name: emp.name,
      active: emp.active,
      plus,
      minus,
      balance: plus - minus,
    };
  });

  // 3. Compute practice KPIs
  const totalPending = pendingRequests.length;
  const activeEmployeesCount = employeesList.filter((e) => e.active).length;
  const overallPracticeBalance = employeesWithBalances.reduce((sum, emp) => sum + emp.balance, 0);

  // 4. Prepare data for the custom CSS-based bar chart
  const maxBalance = Math.max(...employeesWithBalances.map((e) => Math.abs(e.balance)), 5);

  // 5. Fetch all requests for calendar view (not just pending)
  const allRequests = await db.request.findMany({
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

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      
      {/* Admin Navigation Header */}
      <header style={{
        backgroundColor: "var(--surface)",
        borderBottom: "1px solid var(--surface-border)",
        position: "sticky",
        top: 0,
        zIndex: 50,
        boxShadow: "var(--shadow-sm)"
      }}>
        <div className="container" style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "1rem 1.5rem"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <div style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: "2.25rem",
              height: "2.25rem",
              borderRadius: "50%",
              backgroundColor: "var(--primary-glow)",
              color: "var(--primary-light)"
            }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
            </div>
            <span style={{ fontWeight: "700", fontSize: "1.15rem", letterSpacing: "-0.01em", color: "var(--text-main)" }}>
              QuickOvertime <span style={{ color: "var(--primary-light)", fontSize: "0.8rem", fontWeight: "600", border: "1px solid var(--primary-light)", padding: "1px 6px", borderRadius: "var(--radius-sm)", marginLeft: "0.25rem" }}>ADMIN</span>
            </span>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
            <span className="hide-mobile" style={{ fontSize: "0.9rem", fontWeight: "500", color: "var(--text-muted)" }}>
              Rolle: <strong style={{ color: "var(--text-main)" }}>Praxisleitung</strong>
            </span>
            <form action={logoutAction}>
              <button
                type="submit"
                className="btn btn-secondary"
                style={{
                  padding: "0.5rem 1rem",
                  fontSize: "0.85rem",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.35rem",
                  borderRadius: "var(--radius-sm)"
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                  <polyline points="16 17 21 12 16 7" />
                  <line x1="21" y1="12" x2="9" y2="12" />
                </svg>
                Abmelden
              </button>
            </form>
          </div>
        </div>
      </header>

      {/* Main Admin Dashboard */}
      <main className="container" style={{ flex: 1, paddingBottom: "4rem" }}>
        
        {/* Title */}
        <div style={{ marginBottom: "2rem" }}>
          <h2 style={{ fontSize: "1.75rem", fontWeight: "700", color: "var(--text-main)", marginBottom: "0.25rem" }}>
            Praxis-Zentrale
          </h2>
          <p style={{ color: "var(--text-muted)", fontSize: "0.95rem" }}>
            Verwalte Anträge, Überstunden und Abwesenheiten deines Teams.
          </p>
        </div>

        {/* KPI Grid */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: "1.5rem",
          marginBottom: "2.5rem"
        }}>
          {/* Card 1: Pending */}
          <div className="card glass-card" style={{ display: "flex", alignItems: "center", gap: "1.25rem", borderLeft: totalPending > 0 ? "4px solid var(--danger)" : "4px solid var(--success)" }}>
            <div style={{
              width: "3rem",
              height: "3rem",
              borderRadius: "50%",
              backgroundColor: totalPending > 0 ? "var(--danger-bg)" : "var(--success-bg)",
              color: totalPending > 0 ? "var(--danger)" : "var(--success)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center"
            }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 14 14" />
              </svg>
            </div>
            <div>
              <span style={{ fontSize: "0.85rem", color: "var(--text-muted)", fontWeight: "500", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                Ausstehende Anträge
              </span>
              <h3 style={{ fontSize: "1.85rem", fontWeight: "800", color: "var(--text-main)", lineHeight: 1.1 }}>
                {totalPending} {totalPending === 1 ? "Antrag" : "Anträge"}
              </h3>
            </div>
          </div>

          {/* Card 2: Overall balance */}
          <div className="card glass-card" style={{ display: "flex", alignItems: "center", gap: "1.25rem", borderLeft: overallPracticeBalance >= 0 ? "4px solid var(--success)" : "4px solid var(--primary-light)" }}>
            <div style={{
              width: "3rem",
              height: "3rem",
              borderRadius: "50%",
              backgroundColor: "var(--primary-glow)",
              color: "var(--primary-light)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center"
            }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="12" y1="1" x2="12" y2="23" />
                <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
              </svg>
            </div>
            <div>
              <span style={{ fontSize: "0.85rem", color: "var(--text-muted)", fontWeight: "500", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                Überstundenberg (Gesamt)
              </span>
              <h3 style={{ fontSize: "1.85rem", fontWeight: "800", color: overallPracticeBalance >= 0 ? "var(--success)" : "var(--primary-light)", lineHeight: 1.1 }}>
                {overallPracticeBalance >= 0 ? "+" : ""}{overallPracticeBalance.toFixed(1).replace(".", ",")} Std.
              </h3>
            </div>
          </div>

          {/* Card 3: Team */}
          <div className="card glass-card" style={{ display: "flex", alignItems: "center", gap: "1.25rem", borderLeft: "4px solid var(--surface-border)" }}>
            <div style={{
              width: "3rem",
              height: "3rem",
              borderRadius: "50%",
              backgroundColor: "var(--background)",
              color: "var(--text-muted)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center"
            }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            </div>
            <div>
              <span style={{ fontSize: "0.85rem", color: "var(--text-muted)", fontWeight: "500", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                Aktive Mitarbeiterinnen
              </span>
              <h3 style={{ fontSize: "1.85rem", fontWeight: "800", color: "var(--text-main)", lineHeight: 1.1 }}>
                {activeEmployeesCount} / {employeesList.length}
              </h3>
            </div>
          </div>
        </div>

        {/* Tabbed Content Area */}
        <AdminTabs
          totalPending={totalPending}
          pendingRequests={pendingRequests}
          employeesWithBalances={employeesWithBalances}
          maxBalance={maxBalance}
          allRequests={allRequests}
        />

      </main>

    </div>
  );
}
