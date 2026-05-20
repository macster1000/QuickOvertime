"use client";

import { useState } from "react";
import { RequestType } from "@prisma/client";
import PendingQueue from "./PendingQueue";
import EmployeeManager from "./EmployeeManager";
import ExportSection from "./ExportSection";
import CalendarView from "./CalendarView";

interface AdminTabsProps {
  totalPending: number;
  pendingRequests: any[];
  employeesWithBalances: {
    id: number;
    name: string;
    active: boolean;
    plus: number;
    minus: number;
    balance: number;
  }[];
  maxBalance: number;
  allRequests: any[];
}

const TABS = [
  { key: "queue", label: "📥 Freigaben", icon: "queue" },
  { key: "calendar", label: "📅 Kalender", icon: "calendar" },
  { key: "team", label: "👥 Team", icon: "team" },
] as const;

type TabKey = typeof TABS[number]["key"];

export default function AdminTabs({
  totalPending,
  pendingRequests,
  employeesWithBalances,
  maxBalance,
  allRequests,
}: AdminTabsProps) {
  const [activeTab, setActiveTab] = useState<TabKey>("queue");

  return (
    <div>
      {/* Tab Navigation */}
      <div style={{
        display: "flex",
        gap: "0.25rem",
        marginBottom: "2rem",
        borderBottom: "2px solid var(--surface-border)",
        overflowX: "auto"
      }}>
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            style={{
              padding: "0.75rem 1.25rem",
              fontSize: "0.95rem",
              fontWeight: activeTab === tab.key ? "700" : "500",
              color: activeTab === tab.key ? "var(--primary-light)" : "var(--text-muted)",
              borderBottom: activeTab === tab.key ? "2px solid var(--primary-light)" : "2px solid transparent",
              marginBottom: "-2px",
              cursor: "pointer",
              transition: "all 0.15s ease",
              whiteSpace: "nowrap",
              display: "flex",
              alignItems: "center",
              gap: "0.35rem",
              backgroundColor: "transparent",
              border: "none",
              borderRadius: 0,
            }}
          >
            {tab.label}
            {tab.key === "queue" && totalPending > 0 && (
              <span style={{
                backgroundColor: "var(--danger)",
                color: "#ffffff",
                fontSize: "0.7rem",
                padding: "1px 6px",
                borderRadius: "var(--radius-full)",
                fontWeight: "700",
                minWidth: "1.25rem",
                textAlign: "center"
              }}>
                {totalPending}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === "queue" && (
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(420px, 1fr))",
          gap: "2.5rem",
          alignItems: "flex-start"
        }}>
          {/* Left Column: Inbox Freigaben & DATEV Export */}
          <div style={{ display: "flex", flexDirection: "column", gap: "2.5rem" }}>
            <div>
              <h3 style={{ fontSize: "1.25rem", fontWeight: "700", color: "var(--text-main)", marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                Freigabe-Queue
                {totalPending > 0 && (
                  <span style={{ backgroundColor: "var(--danger)", color: "#ffffff", fontSize: "0.75rem", padding: "2px 8px", borderRadius: "var(--radius-full)", fontWeight: "700" }}>
                    {totalPending}
                  </span>
                )}
              </h3>
              <PendingQueue initialRequests={pendingRequests} />
            </div>

            <ExportSection />
          </div>

          {/* Right Column: Visual Charts */}
          <div>
            <h3 style={{ fontSize: "1.25rem", fontWeight: "700", color: "var(--text-main)", marginBottom: "1rem" }}>
              📊 Saldo-Übersicht (Team)
            </h3>
            <div className="card" style={{ padding: "2rem 1.5rem" }}>
              {employeesWithBalances.length === 0 ? (
                <p style={{ textAlign: "center", color: "var(--text-muted)" }}>Keine Daten für das Diagramm vorhanden.</p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                  {employeesWithBalances.map((emp) => {
                    const pct = Math.max(5, Math.min(100, (Math.abs(emp.balance) / maxBalance) * 100));
                    const isPositive = emp.balance >= 0;

                    return (
                      <div key={emp.id} style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem", fontWeight: "500" }}>
                          <span style={{ color: emp.active ? "var(--text-main)" : "var(--text-muted)" }}>
                            {emp.name} {!emp.active && "(Inaktiv)"}
                          </span>
                          <span style={{ fontWeight: "700", color: isPositive ? "var(--success)" : "var(--primary-light)" }}>
                            {isPositive ? "+" : ""}{emp.balance.toFixed(1).replace(".", ",")} Std.
                          </span>
                        </div>
                        <div style={{
                          width: "100%",
                          height: "0.75rem",
                          backgroundColor: "var(--background)",
                          borderRadius: "var(--radius-full)",
                          overflow: "hidden"
                        }}>
                          <div style={{
                            width: `${pct}%`,
                            height: "100%",
                            borderRadius: "var(--radius-full)",
                            background: isPositive 
                              ? "linear-gradient(90deg, var(--success-bg), var(--success))"
                              : "linear-gradient(90deg, var(--primary-glow), var(--primary-light))",
                            transition: "width 0.5s ease-in-out"
                          }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === "calendar" && (
        <CalendarView events={allRequests} />
      )}

      {activeTab === "team" && (
        <EmployeeManager initialEmployees={employeesWithBalances} />
      )}
    </div>
  );
}
