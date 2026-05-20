"use client";

import { useState, useEffect } from "react";
import { loginAction } from "@/lib/actions";

interface Employee {
  id: number;
  name: string;
  role: string;
}

export default function LoginForm({ employees }: { employees: Employee[] }) {
  const [selectedName, setSelectedName] = useState("");
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Automatically submit when PIN reaches 4 digits
  useEffect(() => {
    if (pin.length === 4 && selectedName) {
      handleLogin(selectedName, pin);
    }
  }, [pin, selectedName]);

  const handleLogin = async (name: string, enterPin: string) => {
    setError("");
    setLoading(true);
    
    try {
      const response = await loginAction(name, enterPin);
      if (response && response.error) {
        setError(response.error);
        setPin(""); // Clear PIN on error
      }
    } catch (err) {
      setError("Verbindungsfehler. Bitte erneut versuchen.");
      setPin("");
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (num: string) => {
    if (pin.length < 4) {
      setError(""); // Clear error when typing
      setPin((prev) => prev + num);
    }
  };

  const handleBackspace = () => {
    setPin((prev) => prev.slice(0, -1));
  };

  const handleClear = () => {
    setPin("");
    setError("");
  };

  return (
    <div className="card glass-card" style={{ maxWidth: "420px", width: "100%", padding: "2.5rem 2rem" }}>
      {/* Brand Header */}
      <div style={{ textAlign: "center", marginBottom: "2rem" }}>
        <div style={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          width: "3.5rem",
          height: "3.5rem",
          borderRadius: "50%",
          backgroundColor: "var(--primary-glow)",
          color: "var(--primary-light)",
          marginBottom: "1rem"
        }}>
          {/* Elegant medical cross / clock SVG */}
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
        </div>
        <h1 style={{ fontSize: "1.75rem", fontWeight: "700", letterSpacing: "-0.02em", color: "var(--text-main)", marginBottom: "0.25rem" }}>
          QuickOvertime
        </h1>
        <p style={{ fontSize: "0.9rem", color: "var(--text-muted)" }}>
          HNO-Praxis Zeiterfassung
        </p>
      </div>

      {/* Select Employee */}
      <div className="form-group">
        <label className="form-label" htmlFor="employee-select">Wer bist du?</label>
        <select
          id="employee-select"
          className="form-control"
          value={selectedName}
          onChange={(e) => {
            setSelectedName(e.target.value);
            setPin("");
            setError("");
          }}
          disabled={loading}
          style={{ height: "3rem", fontSize: "1rem", cursor: "pointer" }}
        >
          <option value="">-- Mitarbeiterin wählen --</option>
          {employees.map((emp) => (
            <option key={emp.id} value={emp.name}>
              {emp.name} {emp.role === "ADMIN" ? "(Praxisleitung)" : ""}
            </option>
          ))}
        </select>
      </div>

      {/* PIN entry visualizer */}
      {selectedName && (
        <div style={{ animation: "slideUp 0.3s forwards", marginTop: "1.5rem" }}>
          <p style={{ textAlign: "center", fontSize: "0.9rem", fontWeight: "500", color: "var(--text-muted)", marginBottom: "0.5rem" }}>
            {loading ? "Wird verifiziert..." : "4-stelligen PIN eingeben:"}
          </p>
          
          <div className="pin-dots">
            {[0, 1, 2, 3].map((index) => (
              <div
                key={index}
                className={`pin-dot ${pin.length > index ? "active" : ""}`}
              />
            ))}
          </div>

          {/* Error Message */}
          {error && (
            <div style={{
              backgroundColor: "var(--danger-bg)",
              border: "1px solid var(--danger-border)",
              color: "var(--danger)",
              padding: "0.75rem",
              borderRadius: "var(--radius-sm)",
              fontSize: "0.85rem",
              fontWeight: "500",
              textAlign: "center",
              margin: "1rem 0",
              animation: "pulse 0.2s 2 ease-in-out"
            }}>
              {error}
            </div>
          )}

          {/* On-Screen PIN Keyboard */}
          <div className="keypad">
            {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((num) => (
              <button
                key={num}
                type="button"
                className="keypad-btn"
                onClick={() => handleKeyPress(num)}
                disabled={loading}
              >
                {num}
              </button>
            ))}
            <button
              type="button"
              className="keypad-btn"
              onClick={handleClear}
              disabled={loading || pin.length === 0}
              style={{ fontSize: "0.9rem", fontWeight: "500", opacity: pin.length === 0 ? 0.5 : 1 }}
            >
              C
            </button>
            <button
              type="button"
              className="keypad-btn"
              onClick={() => handleKeyPress("0")}
              disabled={loading}
            >
              0
            </button>
            <button
              type="button"
              className="keypad-btn"
              onClick={handleBackspace}
              disabled={loading || pin.length === 0}
              style={{ display: "flex", alignItems: "center", justifyContent: "center", opacity: pin.length === 0 ? 0.5 : 1 }}
            >
              {/* Backspace icon */}
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 4H8l-7 8 7 8h13a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2z" />
                <line x1="18" y1="9" x2="12" y2="15" />
                <line x1="12" y1="9" x2="18" y2="15" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Footer support text */}
      <div style={{ textAlign: "center", marginTop: "2rem", fontSize: "0.75rem", color: "var(--text-muted)" }}>
        Schutz der Arbeitszeitdaten gemäß DSGVO.
      </div>
    </div>
  );
}
