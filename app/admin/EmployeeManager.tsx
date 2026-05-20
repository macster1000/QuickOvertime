"use client";

import { useState } from "react";
import { createEmployeeAction, toggleEmployeeActiveAction, resetEmployeePinAction } from "@/lib/actions";

interface EmployeeWithBalance {
  id: number;
  name: string;
  active: boolean;
  plus: number;
  minus: number;
  balance: number;
}

export default function EmployeeManager({ initialEmployees }: { initialEmployees: EmployeeWithBalance[] }) {
  const [employees, setEmployees] = useState(initialEmployees);
  const [newName, setNewName] = useState("");
  const [newPin, setNewPin] = useState("");
  const [addError, setAddError] = useState("");
  const [addSuccess, setAddSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  // States for PIN resetting
  const [resetId, setResetId] = useState<number | null>(null);
  const [resetPin, setResetPin] = useState("");
  const [resetSuccessId, setResetSuccessId] = useState<number | null>(null);

  const handleAddEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newPin.trim()) {
      setAddError("Name und PIN sind erforderlich.");
      return;
    }

    if (newPin.length < 4) {
      setAddError("Der PIN-Code muss mindestens 4 Ziffern haben.");
      return;
    }

    setLoading(true);
    setAddError("");
    setAddSuccess(false);

    try {
      const res = await createEmployeeAction(newName, newPin);
      if (res.error) {
        setAddError(res.error);
      } else {
        setAddSuccess(true);
        // Add to local state (for instant feedback before reload)
        const newEmp: EmployeeWithBalance = {
          id: Math.random(), // Temp ID
          name: newName,
          active: true,
          plus: 0,
          minus: 0,
          balance: 0
        };
        setEmployees((prev) => [...prev, newEmp].sort((a, b) => a.name.localeCompare(b.name)));
        setNewName("");
        setNewPin("");
        
        setTimeout(() => setAddSuccess(false), 2000);
      }
    } catch (err) {
      setAddError("Fehler beim Hinzufügen der Mitarbeiterin.");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async (id: number, currentActive: boolean) => {
    const nextActive = !currentActive;
    
    // Optimistic update
    setEmployees((prev) =>
      prev.map((emp) => (emp.id === id ? { ...emp, active: nextActive } : emp))
    );

    try {
      const res = await toggleEmployeeActiveAction(id, nextActive);
      if (res.error) {
        // Revert on error
        setEmployees((prev) =>
          prev.map((emp) => (emp.id === id ? { ...emp, active: currentActive } : emp))
        );
      }
    } catch (err) {
      // Revert on error
      setEmployees((prev) =>
        prev.map((emp) => (emp.id === id ? { ...emp, active: currentActive } : emp))
      );
    }
  };

  const handleResetPin = async (id: number) => {
    if (resetPin.length < 4) {
      alert("Der PIN-Code muss mindestens 4-stellig sein.");
      return;
    }

    try {
      const res = await resetEmployeePinAction(id, resetPin);
      if (res.error) {
        alert(res.error);
      } else {
        setResetSuccessId(id);
        setResetId(null);
        setResetPin("");
        setTimeout(() => setResetSuccessId(null), 2500);
      }
    } catch (err) {
      alert("Fehler beim Zurücksetzen der PIN.");
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "2.5rem" }}>
      
      {/* 1. Add Employee Card */}
      <div className="card" style={{ padding: "1.5rem" }}>
        <h4 style={{ fontWeight: "700", color: "var(--text-main)", marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="8.5" cy="7" r="4" />
            <line x1="20" y1="8" x2="20" y2="14" />
            <line x1="23" y1="11" x2="17" y2="11" />
          </svg>
          Mitarbeiterin hinzufügen
        </h4>

        {addError && (
          <div style={{
            backgroundColor: "var(--danger-bg)",
            border: "1px solid var(--danger-border)",
            color: "var(--danger)",
            padding: "0.5rem 0.75rem",
            borderRadius: "var(--radius-sm)",
            fontSize: "0.85rem",
            fontWeight: "500",
            marginBottom: "1rem"
          }}>
            {addError}
          </div>
        )}

        {addSuccess && (
          <div style={{
            backgroundColor: "var(--success-bg)",
            border: "1px solid var(--success-border)",
            color: "var(--success)",
            padding: "0.5rem 0.75rem",
            borderRadius: "var(--radius-sm)",
            fontSize: "0.85rem",
            fontWeight: "500",
            marginBottom: "1rem"
          }}>
            Mitarbeiterin wurde erfolgreich angelegt! (PIN: 1111)
          </div>
        )}

        <form onSubmit={handleAddEmployee} style={{ display: "flex", gap: "1rem", flexWrap: "wrap", alignItems: "flex-end" }}>
          <div className="form-group" style={{ flex: 2, minWidth: "200px", marginBottom: 0 }}>
            <label className="form-label" htmlFor="new-emp-name" style={{ fontSize: "0.85rem" }}>Name der Mitarbeiterin</label>
            <input
              id="new-emp-name"
              type="text"
              className="form-control"
              placeholder="Z.B. Marie Müller"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              disabled={loading}
              required
            />
          </div>

          <div className="form-group" style={{ flex: 1, minWidth: "120px", marginBottom: 0 }}>
            <label className="form-label" htmlFor="new-emp-pin" style={{ fontSize: "0.85rem" }}>Standard-PIN (4-stellig)</label>
            <input
              id="new-emp-pin"
              type="text"
              pattern="[0-9]*"
              inputMode="numeric"
              maxLength={4}
              className="form-control"
              placeholder="1111"
              value={newPin}
              onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ""))}
              disabled={loading}
              required
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading}
            style={{ padding: "0.75rem 1.5rem", borderRadius: "var(--radius-sm)", height: "2.8rem" }}
          >
            {loading ? "Wird erstellt..." : "Hinzufügen"}
          </button>
        </form>
      </div>

      {/* 2. Employees Management List */}
      <div>
        <h4 style={{ fontWeight: "700", color: "var(--text-main)", marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
          </svg>
          Praxisteam ({employees.length})
        </h4>

        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Status</th>
                <th>Überstunden (+)</th>
                <th>Ausgleich (-)</th>
                <th>Saldo (Gesamt)</th>
                <th style={{ textAlign: "right" }}>Aktionen</th>
              </tr>
            </thead>
            <tbody>
              {employees.map((emp) => {
                const isPositive = emp.balance >= 0;
                const isResetting = resetId === emp.id;
                const isResetSuccess = resetSuccessId === emp.id;

                return (
                  <tr key={emp.id} style={{ opacity: emp.active ? 1 : 0.6 }}>
                    <td style={{ fontWeight: "600", color: "var(--text-main)" }}>
                      {emp.name}
                    </td>
                    <td>
                      <button
                        onClick={() => handleToggleActive(emp.id, emp.active)}
                        className={`badge ${emp.active ? "badge-approved" : "badge-rejected"}`}
                        style={{ cursor: "pointer", border: "none" }}
                        title="Klicken zum Aktivieren/Deaktivieren"
                      >
                        {emp.active ? "Aktiv" : "Inaktiv"}
                      </button>
                    </td>
                    <td style={{ color: "var(--success)", fontWeight: "500" }}>
                      +{emp.plus.toFixed(1).replace(".", ",")} Std.
                    </td>
                    <td style={{ color: "var(--text-muted)", fontWeight: "500" }}>
                      -{emp.minus.toFixed(1).replace(".", ",")} Std.
                    </td>
                    <td style={{
                      fontWeight: "700",
                      color: isPositive ? "var(--success)" : "var(--primary-light)"
                    }}>
                      {isPositive ? "+" : ""}{emp.balance.toFixed(2).replace(".", ",")} Std.
                    </td>
                    <td style={{ textAlign: "right" }}>
                      {isResetting ? (
                        /* Inline PIN reset fields */
                        <div style={{ display: "inline-flex", gap: "0.25rem", alignItems: "center" }}>
                          <input
                            type="text"
                            pattern="[0-9]*"
                            inputMode="numeric"
                            maxLength={4}
                            placeholder="PIN"
                            className="form-control"
                            value={resetPin}
                            onChange={(e) => setResetPin(e.target.value.replace(/\D/g, ""))}
                            style={{ width: "60px", padding: "0.25rem 0.5rem", fontSize: "0.85rem", height: "1.8rem" }}
                          />
                          <button
                            onClick={() => handleResetPin(emp.id)}
                            className="btn btn-primary"
                            style={{ padding: "0.25rem 0.5rem", fontSize: "0.75rem", borderRadius: "var(--radius-sm)", height: "1.8rem" }}
                          >
                            OK
                          </button>
                          <button
                            onClick={() => setResetId(null)}
                            className="btn btn-secondary"
                            style={{ padding: "0.25rem 0.5rem", fontSize: "0.75rem", borderRadius: "var(--radius-sm)", height: "1.8rem" }}
                          >
                            X
                          </button>
                        </div>
                      ) : isResetSuccess ? (
                        <span style={{ fontSize: "0.8rem", color: "var(--success)", fontWeight: "600" }}>
                          ✓ PIN geändert
                        </span>
                      ) : (
                        <button
                          onClick={() => {
                            setResetId(emp.id);
                            setResetPin("");
                          }}
                          className="btn btn-secondary"
                          style={{
                            padding: "0.25rem 0.75rem",
                            fontSize: "0.8rem",
                            borderRadius: "var(--radius-sm)",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "0.25rem"
                          }}
                        >
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                          </svg>
                          PIN neu
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
