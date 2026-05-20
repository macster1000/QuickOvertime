"use client";

import { useState } from "react";
import { updateRequestStatusAction } from "@/lib/actions";
import { Status, RequestType } from "@prisma/client";

const TYPE_CONFIG: Record<string, { label: string; emoji: string; color: string; sign: string }> = {
  OVERTIME: { label: "Überstunden", emoji: "➕", color: "var(--success)", sign: "+" },
  COMPENSATION: { label: "Freizeitausgleich", emoji: "➖", color: "var(--primary-light)", sign: "-" },
  VACATION: { label: "Urlaub", emoji: "🏖️", color: "hsl(32, 95%, 55%)", sign: "" },
  OVERTIME_REDUCTION: { label: "ÜStd.-Abbau", emoji: "⏳", color: "hsl(280, 70%, 60%)", sign: "-" },
};

interface PendingRequest {
  id: number;
  type: RequestType;
  date: Date;
  hours: number;
  reason: string;
  employee: {
    name: string;
  };
}

export default function PendingQueue({ initialRequests }: { initialRequests: PendingRequest[] }) {
  const [requests, setRequests] = useState(initialRequests);
  const [loadingId, setLoadingId] = useState<number | null>(null);
  const [rejectingId, setRejectingId] = useState<number | null>(null);
  const [adminComment, setAdminComment] = useState("");
  const [error, setError] = useState("");

  const handleApprove = async (id: number) => {
    setLoadingId(id);
    setError("");
    try {
      const res = await updateRequestStatusAction(id, Status.APPROVED);
      if (res.error) {
        setError(res.error);
      } else {
        // Remove from local list
        setRequests((prev) => prev.filter((r) => r.id !== id));
      }
    } catch (err) {
      setError("Fehler beim Genehmigen des Antrags.");
    } finally {
      setLoadingId(null);
    }
  };

  const handleReject = async (id: number) => {
    if (!adminComment.trim()) {
      setError("Bitte gib eine Begründung für die Ablehnung an.");
      return;
    }

    setLoadingId(id);
    setError("");
    try {
      const res = await updateRequestStatusAction(id, Status.REJECTED, adminComment);
      if (res.error) {
        setError(res.error);
      } else {
        // Remove from local list and reset states
        setRequests((prev) => prev.filter((r) => r.id !== id));
        setRejectingId(null);
        setAdminComment("");
      }
    } catch (err) {
      setError("Fehler beim Ablehnen des Antrags.");
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
      {error && (
        <div style={{
          backgroundColor: "var(--danger-bg)",
          border: "1px solid var(--danger-border)",
          color: "var(--danger)",
          padding: "0.75rem",
          borderRadius: "var(--radius-sm)",
          fontSize: "0.85rem",
          fontWeight: "500"
        }}>
          {error}
        </div>
      )}

      {requests.length === 0 ? (
        <div className="card" style={{
          textAlign: "center",
          padding: "3rem 1.5rem",
          color: "var(--text-muted)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center"
        }}>
          <div style={{
            width: "3.5rem",
            height: "3.5rem",
            borderRadius: "50%",
            backgroundColor: "var(--success-bg)",
            color: "var(--success)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: "1rem"
          }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <h4 style={{ fontWeight: "700", color: "var(--text-main)", marginBottom: "0.25rem" }}>
            Alles erledigt!
          </h4>
          <p style={{ fontSize: "0.9rem" }}>Es liegen aktuell keine ausstehenden Überstunden-Anträge vor.</p>
        </div>
      ) : (
        requests.map((req) => {
          const formattedDate = new Date(req.date).toLocaleDateString("de-DE", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
          });

          const isOvertime = req.type === RequestType.OVERTIME;
          const isBusy = loadingId === req.id;
          const isRejecting = rejectingId === req.id;
          const tCfg = TYPE_CONFIG[req.type] || TYPE_CONFIG.OVERTIME;
          const isVacation = req.type === RequestType.VACATION;
          const displayVal = isVacation
            ? `${(req.hours / 8).toFixed(1).replace(".", ",")} Tage`
            : `${tCfg.sign}${req.hours.toFixed(2).replace(".", ",")} Std.`;

          return (
            <div
              key={req.id}
              className="card"
              style={{
                borderLeft: `4px solid ${tCfg.color}`,
                display: "flex",
                flexDirection: "column",
                gap: "1rem",
                animation: "slideUp 0.3s forwards"
              }}
            >
              {/* Header Info */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "0.5rem" }}>
                <div>
                  <h4 style={{ fontWeight: "700", color: "var(--text-main)", fontSize: "1.1rem" }}>
                    {req.employee.name}
                  </h4>
                  <span style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
                    Beantragt für den <strong>{formattedDate}</strong>
                  </span>
                </div>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
                  <span style={{
                    fontSize: "1.25rem",
                    fontWeight: "800",
                    color: tCfg.color
                  }}>
                    {displayVal}
                  </span>
                  <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: "500" }}>
                    {tCfg.emoji} {tCfg.label}
                  </span>
                </div>
              </div>

              {/* Reason */}
              <div style={{
                backgroundColor: "var(--background)",
                padding: "0.75rem 1rem",
                borderRadius: "var(--radius-sm)",
                fontSize: "0.95rem",
                color: "var(--text-main)",
                border: "1px solid var(--surface-border)"
              }}>
                <strong>Grund:</strong> {req.reason}
              </div>

              {/* Action Buttons Panel */}
              {!isRejecting ? (
                <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.5rem", marginTop: "0.25rem" }}>
                  <button
                    onClick={() => {
                      setRejectingId(req.id);
                      setAdminComment("");
                      setError("");
                    }}
                    className="btn btn-danger"
                    disabled={isBusy}
                    style={{
                      padding: "0.5rem 1.25rem",
                      fontSize: "0.85rem",
                      borderRadius: "var(--radius-sm)",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "0.25rem"
                    }}
                  >
                    Ablehnen
                  </button>
                  <button
                    onClick={() => handleApprove(req.id)}
                    className="btn btn-primary"
                    disabled={isBusy}
                    style={{
                      padding: "0.5rem 1.25rem",
                      fontSize: "0.85rem",
                      borderRadius: "var(--radius-sm)",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "0.25rem"
                    }}
                  >
                    {isBusy ? "Freigabe..." : "Freigeben"}
                  </button>
                </div>
              ) : (
                /* Rejection comment drawer */
                <div style={{
                  borderTop: "1px solid var(--surface-border)",
                  paddingTop: "1rem",
                  marginTop: "0.25rem",
                  animation: "slideUp 0.2s forwards"
                }}>
                  <label className="form-label" htmlFor={`reject-comment-${req.id}`} style={{ fontSize: "0.85rem", color: "var(--danger)", fontWeight: "600" }}>
                    Ablehnungsgrund (Pflichtfeld):
                  </label>
                  <textarea
                    id={`reject-comment-${req.id}`}
                    className="form-control"
                    rows={2}
                    placeholder="Z.B. Falsches Datum, wurde bereits ausgezahlt..."
                    value={adminComment}
                    onChange={(e) => setAdminComment(e.target.value)}
                    required
                    style={{ resize: "none", marginBottom: "0.75rem", border: "1px solid var(--danger-border)" }}
                  />
                  <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.5rem" }}>
                    <button
                      type="button"
                      onClick={() => {
                        setRejectingId(null);
                        setAdminComment("");
                      }}
                      className="btn btn-secondary"
                      disabled={isBusy}
                      style={{ padding: "0.4rem 1rem", fontSize: "0.8rem", borderRadius: "var(--radius-sm)" }}
                    >
                      Abbrechen
                    </button>
                    <button
                      type="button"
                      onClick={() => handleReject(req.id)}
                      className="btn"
                      disabled={isBusy}
                      style={{
                        backgroundColor: "var(--danger)",
                        color: "#ffffff",
                        padding: "0.4rem 1rem",
                        fontSize: "0.8rem",
                        borderRadius: "var(--radius-sm)"
                      }}
                    >
                      {isBusy ? "Ablehnen..." : "Bestätigen"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })
      )}
    </div>
  );
}
