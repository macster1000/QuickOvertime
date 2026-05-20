import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { logoutAction } from "@/lib/actions";
import { Role, Status, RequestType } from "@prisma/client";
import { redirect } from "next/navigation";
import SubmitRequestModal from "./SubmitRequestModal";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const session = await getSession();
  
  if (!session) {
    redirect("/login");
  }

  // 1. Fetch employee details
  const employee = await db.employee.findUnique({
    where: { id: session.id },
  });

  if (!employee || !employee.active) {
    redirect("/login");
  }

  // 2. Fetch all requests to render the history table
  const requests = await db.request.findMany({
    where: { employeeId: session.id },
    orderBy: { date: "desc" },
  });

  // 3. Compute running balance (Approved Overtime - Approved Compensation)
  const approvedOvertimeSum = await db.request.aggregate({
    _sum: { hours: true },
    where: {
      employeeId: session.id,
      type: RequestType.OVERTIME,
      status: Status.APPROVED,
    },
  });

  const approvedCompensationSum = await db.request.aggregate({
    _sum: { hours: true },
    where: {
      employeeId: session.id,
      type: RequestType.COMPENSATION,
      status: Status.APPROVED,
    },
  });

  const plusHours = approvedOvertimeSum._sum.hours || 0;
  const minusHours = approvedCompensationSum._sum.hours || 0;
  const balance = plusHours - minusHours;

  const isPositiveBalance = balance >= 0;
  const formattedBalance = `${isPositiveBalance ? "+" : ""}${balance.toFixed(2).replace(".", ",")} Std.`;

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      {/* Premium Navigation Header */}
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
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
            </div>
            <span style={{ fontWeight: "700", fontSize: "1.15rem", letterSpacing: "-0.01em", color: "var(--text-main)" }}>
              QuickOvertime
            </span>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
            <span className="hide-mobile" style={{ fontSize: "0.9rem", fontWeight: "500", color: "var(--text-muted)" }}>
              Mitarbeiterin: <strong style={{ color: "var(--text-main)" }}>{employee.name}</strong>
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

      {/* Main Dashboard Panel */}
      <main className="container" style={{ flex: 1, paddingBottom: "6rem" }}>
        
        {/* Welcome Section */}
        <div style={{ marginBottom: "2rem" }}>
          <h2 style={{ fontSize: "1.75rem", fontWeight: "700", color: "var(--text-main)", marginBottom: "0.25rem" }}>
            Hallo {employee.name}!
          </h2>
          <p style={{ color: "var(--text-muted)", fontSize: "0.95rem" }}>
            Hier kannst du deine Überstunden eintragen und deinen aktuellen Saldo einsehen.
          </p>
        </div>

        {/* Saldo Hero Card */}
        <div className="card glass-card" style={{
          padding: "2rem",
          marginBottom: "2.5rem",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
          border: isPositiveBalance ? "1px solid var(--success-border)" : "1px solid var(--surface-border)"
        }}>
          <span style={{ fontSize: "0.9rem", fontWeight: "600", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.5rem" }}>
            Aktuelles Überstundenkonto
          </span>
          <span style={{
            fontSize: "3.5rem",
            fontWeight: "800",
            letterSpacing: "-0.03em",
            color: isPositiveBalance ? "var(--success)" : "var(--primary-light)",
            lineHeight: 1.1,
            marginBottom: "0.5rem",
            filter: "drop-shadow(0 4px 12px rgba(0, 0, 0, 0.05))"
          }}>
            {formattedBalance}
          </span>
          <div style={{ display: "flex", gap: "1rem", fontSize: "0.85rem", color: "var(--text-muted)" }}>
            <span>Eingetragen: <strong>+{plusHours.toFixed(1).replace(".", ",")} Std.</strong></span>
            <span style={{ color: "var(--surface-border)", width: "1px", backgroundColor: "var(--surface-border)" }} />
            <span>Abgefeiert: <strong>-{minusHours.toFixed(1).replace(".", ",")} Std.</strong></span>
          </div>
        </div>

        {/* Recent Requests Section */}
        <div>
          <h3 style={{ fontSize: "1.25rem", fontWeight: "700", color: "var(--text-main)", marginBottom: "1rem" }}>
            Deine letzten Anträge
          </h3>

          {requests.length === 0 ? (
            <div className="card" style={{ textAlign: "center", padding: "3rem 1.5rem", color: "var(--text-muted)" }}>
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginBottom: "1rem", opacity: 0.5 }}>
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
                <polyline points="10 9 9 9 8 9" />
              </svg>
              <p>Du hast bisher noch keine Anträge eingereicht.</p>
              <p style={{ fontSize: "0.85rem", marginTop: "0.25rem" }}>Trage deine erste Überstunde mit dem Button unten rechts ein!</p>
            </div>
          ) : (
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Datum</th>
                    <th>Typ</th>
                    <th>Stunden</th>
                    <th>Begründung</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {requests.map((req) => {
                    const formattedDate = req.date.toLocaleDateString("de-DE", {
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                    });

                    const isOvertime = req.type === RequestType.OVERTIME;
                    
                    return (
                      <tr key={req.id}>
                        <td style={{ fontWeight: "500" }}>{formattedDate}</td>
                        <td>
                          <span style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "0.25rem",
                            fontSize: "0.9rem",
                            color: isOvertime ? "var(--success)" : "var(--primary-light)"
                          }}>
                            {isOvertime ? "➕ Plus" : "➖ Ausgleich"}
                          </span>
                        </td>
                        <td style={{ fontWeight: "600" }}>
                          {isOvertime ? "+" : "-"}{req.hours.toFixed(2).replace(".", ",")} Std.
                        </td>
                        <td style={{
                          maxWidth: "240px",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap"
                        }} title={req.reason}>
                          {req.reason}
                        </td>
                        <td>
                          {req.status === Status.PENDING && (
                            <span className="badge badge-pending">Ausstehend</span>
                          )}
                          {req.status === Status.APPROVED && (
                            <span className="badge badge-approved">Freigegeben</span>
                          )}
                          {req.status === Status.REJECTED && (
                            <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                              <span className="badge badge-rejected">Abgelehnt</span>
                              {req.adminComment && (
                                <span style={{
                                  fontSize: "0.75rem",
                                  color: "var(--danger)",
                                  fontStyle: "italic",
                                  maxWidth: "160px",
                                  lineHeight: 1.2
                                }}>
                                  💡 {req.adminComment}
                                </span>
                              )}
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* Submit Request Floating Modal component */}
      <SubmitRequestModal />
    </div>
  );
}
