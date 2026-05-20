"use client";

import { useState } from "react";
import { createRequestAction } from "@/lib/actions";
import { RequestType } from "@prisma/client";

const TYPE_CONFIG = {
  [RequestType.OVERTIME]: { label: "Überstunden", emoji: "➕", color: "var(--success)" },
  [RequestType.COMPENSATION]: { label: "Freizeitausgleich", emoji: "➖", color: "var(--primary-light)" },
  [RequestType.VACATION]: { label: "Urlaub", emoji: "🏖️", color: "hsl(32, 95%, 55%)" },
  [RequestType.OVERTIME_REDUCTION]: { label: "ÜStd.-Abbau", emoji: "⏳", color: "hsl(280, 70%, 60%)" },
};

export default function SubmitRequestModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [type, setType] = useState<RequestType>(RequestType.OVERTIME);
  const [date, setDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [hours, setHours] = useState(1.0);
  const [reason, setReason] = useState("");
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const isVacation = type === RequestType.VACATION;
  const unit = isVacation ? "Tage" : "Std.";
  const displayValue = isVacation ? (hours / 8).toFixed(1).replace(".", ",") : hours.toFixed(2).replace(".", ",");

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
        setReason("");
        setHours(isVacation ? 8.0 : 1.0);
        setType(RequestType.OVERTIME);
        
        setTimeout(() => {
          setIsOpen(false);
          setSuccess(false);
        }, 1800);
      }
    } catch (err: any) {
      console.error("DEBUG SUBMIT ERROR:", err);
      setError(`Ein unerwarteter Fehler ist aufgetreten: ${err?.message || err}`);
    } finally {
      setLoading(false);
    }
  };

  const adjustHours = (amount: number) => {
    setHours((prev) => Math.max(isVacation ? 4.0 : 0.25, +(prev + amount).toFixed(2)));
  };

  const handleTypeChange = (newType: RequestType) => {
    setType(newType);
    if (newType === RequestType.VACATION) {
      setHours(8.0); // Default: 1 Tag
    } else {
      setHours(1.0);
    }
  };

  const placeholderMap: Record<RequestType, string> = {
    [RequestType.OVERTIME]: "Z.B. Patientenüberhang Sprechstunde, Späte OP...",
    [RequestType.COMPENSATION]: "Z.B. Früher nach Hause gegangen, Zahnarzt...",
    [RequestType.VACATION]: "Z.B. Jahresurlaub, Familienfeier, Brückentag...",
    [RequestType.OVERTIME_REDUCTION]: "Z.B. Überstundenabbau, Gleitzeit-Ausgleich...",
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
                  Dein Antrag wurde eingereicht und die Praxisleitung per WhatsApp benachrichtigt.
                </p>
              </div>
            ) : (
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

                  {/* Type Selection (2x2 Grid) */}
                  <label className="form-label">Eintragsart</label>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem", marginBottom: "1.25rem" }}>
                    {(Object.keys(TYPE_CONFIG) as RequestType[]).map((t) => {
                      const cfg = TYPE_CONFIG[t];
                      const isActive = type === t;
                      return (
                        <div
                          key={t}
                          onClick={() => handleTypeChange(t)}
                          style={{
                            padding: "0.65rem 0.5rem",
                            borderRadius: "var(--radius-sm)",
                            border: isActive ? `2px solid ${cfg.color}` : "2px solid var(--surface-border)",
                            backgroundColor: isActive ? `${cfg.color}15` : "var(--surface)",
                            cursor: "pointer",
                            textAlign: "center",
                            fontSize: "0.85rem",
                            fontWeight: isActive ? "700" : "500",
                            color: isActive ? cfg.color : "var(--text-muted)",
                            transition: "all 0.15s ease",
                            userSelect: "none"
                          }}
                        >
                          {cfg.emoji} {cfg.label}
                        </div>
                      );
                    })}
                  </div>

                  {/* Date Input */}
                  <div className="form-group">
                    <label className="form-label" htmlFor="request-date">
                      {isVacation ? "Startdatum" : "Datum"}
                    </label>
                    <input
                      id="request-date"
                      type="date"
                      className="form-control"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      required
                    />
                  </div>

                  {/* Hours/Days Custom Stepper */}
                  <div className="form-group" style={{ marginBottom: "1.5rem" }}>
                    <label className="form-label" style={{ display: "flex", justifyContent: "space-between" }}>
                      <span>{isVacation ? "Dauer (Tage)" : "Dauer"}</span>
                      <span style={{ fontWeight: "700", color: TYPE_CONFIG[type].color }}>
                        {displayValue} {unit}
                      </span>
                    </label>
                    
                    {isVacation ? (
                      <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                        <button type="button" onClick={() => adjustHours(-8.0)} className="btn btn-secondary" style={{ flex: 1, padding: "0.5rem", borderRadius: "var(--radius-sm)" }}>-1 Tag</button>
                        <button type="button" onClick={() => adjustHours(-4.0)} className="btn btn-secondary" style={{ flex: 1, padding: "0.5rem", borderRadius: "var(--radius-sm)" }}>-½ Tag</button>
                        <button type="button" onClick={() => adjustHours(4.0)} className="btn btn-secondary" style={{ flex: 1, padding: "0.5rem", borderRadius: "var(--radius-sm)" }}>+½ Tag</button>
                        <button type="button" onClick={() => adjustHours(8.0)} className="btn btn-secondary" style={{ flex: 1, padding: "0.5rem", borderRadius: "var(--radius-sm)" }}>+1 Tag</button>
                      </div>
                    ) : (
                      <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                        <button type="button" onClick={() => adjustHours(-1.0)} className="btn btn-secondary" style={{ flex: 1, padding: "0.5rem", borderRadius: "var(--radius-sm)" }}>-1.0</button>
                        <button type="button" onClick={() => adjustHours(-0.25)} className="btn btn-secondary" style={{ flex: 1, padding: "0.5rem", borderRadius: "var(--radius-sm)" }}>-0.25</button>
                        <button type="button" onClick={() => adjustHours(0.25)} className="btn btn-secondary" style={{ flex: 1, padding: "0.5rem", borderRadius: "var(--radius-sm)" }}>+0.25</button>
                        <button type="button" onClick={() => adjustHours(1.0)} className="btn btn-secondary" style={{ flex: 1, padding: "0.5rem", borderRadius: "var(--radius-sm)" }}>+1.0</button>
                      </div>
                    )}
                  </div>

                  {/* Reason Text Area */}
                  <div className="form-group">
                    <label className="form-label" htmlFor="request-reason">Begründung (Pflichtfeld)</label>
                    <textarea
                      id="request-reason"
                      className="form-control"
                      rows={3}
                      placeholder={placeholderMap[type]}
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

      <style jsx global>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>
    </>
  );
}
