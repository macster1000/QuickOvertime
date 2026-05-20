"use server";

import { db } from "./db";
import { getSession, setSession, clearSession } from "./auth";
import { Role, RequestType, Status } from "@prisma/client";
import bcrypt from "bcryptjs";
import { sendWhatsAppNotification } from "./notifications";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export interface ActionResponse {
  success?: boolean;
  error?: string;
}

/**
 * Logs in an employee or admin using their name and 4-digit PIN.
 */
export async function loginAction(name: string, pin: string): Promise<ActionResponse> {
  if (!name || !pin) {
    return { error: "Name und PIN-Code sind erforderlich." };
  }

  try {
    const employee = await db.employee.findUnique({
      where: { name },
    });

    if (!employee || !employee.active) {
      return { error: "Mitarbeiterin wurde nicht gefunden oder ist inaktiv." };
    }

    const pinMatch = bcrypt.compareSync(pin, employee.pinHash);
    if (!pinMatch) {
      return { error: "Ungültiger PIN-Code." };
    }

    await setSession({
      id: employee.id,
      name: employee.name,
      role: employee.role,
    });
  } catch (error) {
    console.error("Login action error:", error);
    return { error: "Serverfehler während der Anmeldung." };
  }

  // Redirect based on role
  const session = await getSession();
  if (session?.role === Role.ADMIN) {
    redirect("/admin");
  } else {
    redirect("/dashboard");
  }
}

/**
 * Logs out the current user and redirects to the login page.
 */
export async function logoutAction() {
  await clearSession();
  redirect("/login");
}

/**
 * Submits a new overtime or compensation request.
 */
export async function createRequestAction(
  type: RequestType,
  dateStr: string,
  hours: number,
  reason: string
): Promise<ActionResponse> {
  try {
    console.log("createRequestAction called with:", { type, dateStr, hours, reason });
    const session = await getSession();
    console.log("createRequestAction session retrieved:", session);
    if (!session) {
      return { error: "Nicht autorisiert. Bitte melde dich erneut an." };
    }

    if (!dateStr || !hours || !reason) {
      return { error: "Bitte fülle alle Pflichtfelder aus." };
    }

    if (hours <= 0) {
      return { error: "Die Stundenzahl muss größer als 0 sein." };
    }

    const date = new Date(dateStr);
    
    const newRequest = await db.request.create({
      data: {
        employeeId: session.id,
        type,
        date,
        hours,
        reason,
        status: Status.PENDING,
      },
    });
    console.log("createRequestAction request created in db:", newRequest);

    // Send WhatsApp Push Notification in background (non-blocking)
    sendWhatsAppNotification({
      employeeName: session.name,
      type,
      hours,
      date,
      reason,
    }).catch((err) => console.error("WhatsApp notification background error:", err));

    revalidatePath("/dashboard");
    revalidatePath("/admin");
    return { success: true };
  } catch (error: any) {
    console.error("CRITICAL EXCEPTION in createRequestAction:", error);
    return { error: `Fehler beim Einreichen des Antrags: ${error?.message || error}` };
  }
}

/**
 * Approves or Rejects a pending overtime request.
 * Admins only.
 */
export async function updateRequestStatusAction(
  requestId: number,
  status: Status,
  adminComment?: string
): Promise<ActionResponse> {
  const session = await getSession();
  if (!session || session.role !== Role.ADMIN) {
    return { error: "Nicht autorisiert. Nur die Praxisleitung darf Anträge bearbeiten." };
  }

  try {
    await db.request.update({
      where: { id: requestId },
      data: {
        status,
        adminComment: status === Status.REJECTED ? adminComment || null : null,
      },
    });

    revalidatePath("/admin");
    revalidatePath("/dashboard");
    return { success: true };
  } catch (error) {
    console.error("Update request status action error:", error);
    return { error: "Fehler beim Aktualisieren des Status." };
  }
}

/**
 * Creates a new employee account.
 * Admins only.
 */
export async function createEmployeeAction(
  name: string,
  pin: string
): Promise<ActionResponse> {
  const session = await getSession();
  if (!session || session.role !== Role.ADMIN) {
    return { error: "Nicht autorisiert." };
  }

  if (!name || !pin) {
    return { error: "Name und PIN sind erforderlich." };
  }

  if (pin.length < 4) {
    return { error: "Der PIN-Code muss mindestens 4 Ziffern haben." };
  }

  try {
    const existing = await db.employee.findUnique({
      where: { name },
    });

    if (existing) {
      return { error: "Eine Mitarbeiterin mit diesem Namen existiert bereits." };
    }

    const pinHash = bcrypt.hashSync(pin, 10);

    await db.employee.create({
      data: {
        name,
        pinHash,
        role: Role.EMPLOYEE,
        active: true,
      },
    });

    revalidatePath("/admin");
    return { success: true };
  } catch (error) {
    console.error("Create employee action error:", error);
    return { error: "Fehler beim Anlegen der Mitarbeiterin." };
  }
}

/**
 * Toggles the active status of an employee.
 * Admins only.
 */
export async function toggleEmployeeActiveAction(
  employeeId: number,
  active: boolean
): Promise<ActionResponse> {
  const session = await getSession();
  if (!session || session.role !== Role.ADMIN) {
    return { error: "Nicht autorisiert." };
  }

  try {
    await db.employee.update({
      where: { id: employeeId },
      data: { active },
    });

    revalidatePath("/admin");
    return { success: true };
  } catch (error) {
    console.error("Toggle employee active action error:", error);
    return { error: "Fehler beim Ändern des Aktivitätsstatus." };
  }
}

/**
 * Resets an employee's PIN.
 * Admins only.
 */
export async function resetEmployeePinAction(
  employeeId: number,
  newPin: string
): Promise<ActionResponse> {
  const session = await getSession();
  if (!session || session.role !== Role.ADMIN) {
    return { error: "Nicht autorisiert." };
  }

  if (!newPin || newPin.length < 4) {
    return { error: "Der PIN-Code muss mindestens 4 Ziffern haben." };
  }

  try {
    const pinHash = bcrypt.hashSync(newPin, 10);

    await db.employee.update({
      where: { id: employeeId },
      data: { pinHash },
    });

    return { success: true };
  } catch (error) {
    console.error("Reset employee PIN action error:", error);
    return { error: "Fehler beim Zurücksetzen der PIN." };
  }
}
