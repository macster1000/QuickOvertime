"use client";

import { useState } from "react";
import { createRequestAction } from "@/lib/actions";
import { RequestType } from "@prisma/client";

export default function SubmitRequestModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [type, setType] = useState<RequestType>(RequestType.OVERTIME);
  const [date, setDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [hours, setHours] = useState(1.0);
  const [reason, setReason] = useState("");
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) {
      setError("Bitte gib eine kurze Begründung an.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await createRequestAction(type, date, hours, reason);
      if (res.error) {
        setError(res.error);
      } else {
        setSuccess(true);
        // Reset form
        setReason("");
        setHours(1.0);
        setType(RequestType.OVERTIME);
        
        // Close modal after showing success animation
        setTimeout(() => {
          setIsOpen(false);
          setSuccess(false);
        }, 1800);
      }
    } catch (err) {
      setError("Ein unerwarteter Fehler ist aufgetreten.");
    } finally {
      setLoading(false);
    }
  };

  const adjustHours = (amount: number) => {
    setHours((prev) => Math.max(0.25, +(prev + amount).toFixed(2)));
  };

  return (
    <>
      {/* Floating Action Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="btn btn-primary"
        style={{
          position: "fixed",
          bottom: "2rem",
          right: "2rem",
          padding: "1rem 2rem",
          fontSize: "1.05rem",
          boxShadow: "0 8px 24px var(--primary-glow)",
          zIndex: 90,
          display: "inline-flex",
          alignItems: "center",
          gap: "0.5rem"
        }}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
        Eintrag erfassen
      </button>

      {/* Modal dialog overlay */}
      {isOpen && (
        <div className="modal-overlay" style={{ animation: "fadeIn 0.2s forwards" }}>
          <div className="modal-content" style={{ border: success ? "1px solid var(--success-border)" : "1px solid var(--surface-border)" }}>
            
            {success ? (
              /* Success Panel with micro-animation */
              <div style={{
                padding: "3rem 2rem",
                textAlign: "center",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                animation: "slideUp 0.3s forwards"
              }}>
                <div style={{
                  width: "5rem",
                  height: "5rem",
                  borderRadius: "50%",
                  backgroundColor: "var(--success-bg)",
                  color: "var(--success)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: "1.5rem",
                  animation: "checkSuccess 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards"
                }}>
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
                <h3 style={{ fontSize: "1.5rem", fontWeight: "700", color: "var(--text-main)", marginBottom: "0.5rem" }}>
                  Erfolgreich gesendet!
                </h3>
                <p style={{ color: "var(--text-muted)", fontSize: "0.95rem" }}>
                  Dein Antrag wurde eingereicht und deine Frau per WhatsApp benachrichtigt.
                </p>
              </div>
            ) : (
              /* Main Form */
              <form onSubmit={handleSubmit}>
                <div className="modal-header">
                  <h3 style={{ fontWeight: "700", fontSize: "1.25rem", color: "var(--text-main)" }}>
                    Neuen Eintrag erfassen
                  </h3>
                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    style={{
                      cursor: "pointer",
                      color: "var(--text-muted)",
                      padding: "0.25rem",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center"
                    }}
                  >
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                </div>

                <div className="modal-body">
                  {error && (
                    <div style={{
                      backgroundColor: "var(--danger-bg)",
                      border: "1px solid var(--danger-border)",
                      color: "var(--danger)",
                      padding: "0.75rem",
                      borderRadius: "var(--radius-sm)",
                      fontSize: "0.85rem",
                      fontWeight: "500",
                      marginBottom: "1.25rem"
                    }}>
                      {error}
                    </div>
                  )}

                  {/* Type Selection (Segmented Control) */}
                  <label className="form-label">Eintragsart</label>
                  <div className="segmented-control">
                    <div
                      className={`segmented-option ${type === RequestType.OVERTIME ? "active" : ""}`}
                      onClick={() => setType(RequestType.OVERTIME)}
                      style={{ color: type === RequestType.OVERTIME ? "var(--success)" : "var(--text-muted)" }}
                    >
                      ➕ Überstunden
                    </div>
                    <div
                      className={`segmented-option ${type === RequestType.COMPENSATION ? "active" : ""}`}
                      onClick={() => setType(RequestType.COMPENSATION)}
                      style={{ color: type === RequestType.COMPENSATION ? "var(--primary-light)" : "var(--text-muted)" }}
                    >
                      ➖ Freizeitausgleich
                    </div>
                  </div>

                  {/* Date Input */}
                  <div className="form-group">
                    <label className="form-label" htmlFor="request-date">Datum</label>
                    <input
                      id="request-date"
                      type="date"
                      className="form-control"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      required
                    />
                  </div>

                  {/* Hours Custom Stepper */}
                  <div className="form-group" style={{ marginBottom: "1.5rem" }}>
                    <label className="form-label" style={{ display: "flex", justifyContent: "space-between" }}>
                      <span>Dauer</span>
                      <span style={{ fontWeight: "700", color: "var(--primary-light)" }}>{hours.toFixed(2).replace(".", ",")} Std.</span>
                    </label>
                    
                    <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                      <button
                        type="button"
                        onClick={() => adjustHours(-1.0)}
                        className="btn btn-secondary"
                        style={{ flex: 1, padding: "0.5rem", borderRadius: "var(--radius-sm)" }}
                      >
                        -1.0
                      </button>
                      <button
                        type="button"
                        onClick={() => adjustHours(-0.25)}
                        className="btn btn-secondary"
                        style={{ flex: 1, padding: "0.5rem", borderRadius: "var(--radius-sm)" }}
                      >
                        -0.25
                      </button>
                      <button
                        type="button"
                        onClick={() => adjustHours(0.25)}
                        className="btn btn-secondary"
                        style={{ flex: 1, padding: "0.5rem", borderRadius: "var(--radius-sm)" }}
                      >
                        +0.25
                      </button>
                      <button
                        type="button"
                        onClick={() => adjustHours(1.0)}
                        className="btn btn-secondary"
                        style={{ flex: 1, padding: "0.5rem", borderRadius: "var(--radius-sm)" }}
                      >
                        +1.0
                      </button>
                    </div>
                  </div>

                  {/* Reason Text Area */}
                  <div className="form-group">
                    <label className="form-label" htmlFor="request-reason">Begründung (Pflichtfeld)</label>
                    <textarea
                      id="request-reason"
                      className="form-control"
                      rows={3}
                      placeholder={
                        type === RequestType.OVERTIME
                          ? "Z.B. Patientenüberhang Sprechstunde, Späte OP..."
                          : "Z.B. Früher nach Hause gegangen, Zahnarzt..."
                      }
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      required
                      style={{ resize: "none" }}
                    />
                  </div>
                </div>

                <div className="modal-footer">
                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    className="btn btn-secondary"
                    disabled={loading}
                    style={{ borderRadius: "var(--radius-sm)" }}
                  >
                    Abbrechen
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={loading}
                    style={{ borderRadius: "var(--radius-sm)", minWidth: "120px" }}
                  >
                    {loading ? "Senden..." : "Absenden"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Embedded fade-in animation */}
      <style jsx global>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>
    </>
  );
}
