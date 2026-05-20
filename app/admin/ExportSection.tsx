"use client";

import { useState } from "react";

export default function ExportSection() {
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    return `${year}-${month}`; // YYYY-MM
  });

  // Dynamically generate the last 12 months in German format
  const getMonthOptions = () => {
    const options = [];
    const now = new Date();
    
    for (let i = 0; i < 12; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const year = d.getFullYear();
      const monthNum = String(d.getMonth() + 1).padStart(2, "0");
      const monthValue = `${year}-${monthNum}`;
      
      const label = d.toLocaleDateString("de-DE", {
        month: "long",
        year: "numeric"
      });
      
      options.push({ value: monthValue, label });
    }
    return options;
  };

  const months = getMonthOptions();

  return (
    <div className="card glass-card" style={{ padding: "1.5rem" }}>
      <h4 style={{ fontWeight: "700", color: "var(--text-main)", marginBottom: "0.5rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="7 10 12 15 17 10" />
          <line x1="12" y1="15" x2="12" y2="3" />
        </svg>
        Steuerberater / DATEV Export
      </h4>
      <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: "1.25rem" }}>
        Lade alle genehmigten Überstunden- und Ausgleichsbuchungen eines bestimmten Monats als CSV-Datei herunter. Die Spalten und Zahlen sind DATEV-kompatibel im deutschen Format aufbereitet.
      </p>

      <div style={{ display: "flex", gap: "1rem", alignItems: "flex-end", flexWrap: "wrap" }}>
        <div className="form-group" style={{ flex: 1, minWidth: "180px", marginBottom: 0 }}>
          <label className="form-label" htmlFor="export-month-select" style={{ fontSize: "0.85rem" }}>Monat auswählen</label>
          <select
            id="export-month-select"
            className="form-control"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            style={{ height: "2.8rem", fontSize: "0.95rem", cursor: "pointer" }}
          >
            {months.map((m) => (
              <option key={m.value} value={m.value}>
                {m.label}
              </option>
            ))}
          </select>
        </div>

        <a
          href={`/api/export?month=${selectedMonth}`}
          className="btn btn-primary"
          style={{
            padding: "0.75rem 1.5rem",
            borderRadius: "var(--radius-sm)",
            height: "2.8rem",
            display: "inline-flex",
            alignItems: "center",
            gap: "0.5rem"
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
          Export herunterladen
        </a>
      </div>
    </div>
  );
}
