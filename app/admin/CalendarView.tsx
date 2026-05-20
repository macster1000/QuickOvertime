"use client";

import { useState, useMemo } from "react";
import { RequestType, Status } from "@prisma/client";

interface CalendarEvent {
  id: number;
  type: RequestType;
  status: Status;
  date: Date;
  hours: number;
  reason: string;
  employee: {
    name: string;
  };
}

interface CalendarViewProps {
  events: CalendarEvent[];
}

const TYPE_COLORS: Record<string, { bg: string; label: string; emoji: string }> = {
  OVERTIME: { bg: "hsl(152, 69%, 42%)", label: "Überstunden", emoji: "➕" },
  COMPENSATION: { bg: "hsl(217, 91%, 60%)", label: "Freizeitausgleich", emoji: "➖" },
  VACATION: { bg: "hsl(32, 95%, 55%)", label: "Urlaub", emoji: "🏖️" },
  OVERTIME_REDUCTION: { bg: "hsl(280, 70%, 60%)", label: "ÜStd.-Abbau", emoji: "⏳" },
};

const WEEKDAYS = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"];
const MONTHS = [
  "Januar", "Februar", "März", "April", "Mai", "Juni",
  "Juli", "August", "September", "Oktober", "November", "Dezember",
];

function toDateKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function getMondayStartGrid(year: number, month: number) {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  // Monday = 0, Sunday = 6
  let dayOfWeek = firstDay.getDay() - 1;
  if (dayOfWeek < 0) dayOfWeek = 6;

  const days: { date: Date; inMonth: boolean }[] = [];

  // Previous month fill
  for (let i = dayOfWeek - 1; i >= 0; i--) {
    const d = new Date(year, month, -i);
    days.push({ date: d, inMonth: false });
  }

  // Current month
  for (let d = 1; d <= lastDay.getDate(); d++) {
    days.push({ date: new Date(year, month, d), inMonth: true });
  }

  // Next month fill (complete the grid to full weeks)
  while (days.length % 7 !== 0) {
    const next = new Date(year, month + 1, days.length - dayOfWeek - lastDay.getDate() + 1);
    days.push({ date: next, inMonth: false });
  }

  return days;
}

export default function CalendarView({ events }: CalendarViewProps) {
  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [selectedDay, setSelectedDay] = useState<string | null>(null);

  // Group events by date key, exclude REJECTED
  const eventsByDate = useMemo(() => {
    const map: Record<string, CalendarEvent[]> = {};
    for (const ev of events) {
      if (ev.status === Status.REJECTED) continue;
      const d = new Date(ev.date);
      const key = toDateKey(d);
      if (!map[key]) map[key] = [];
      map[key].push(ev);
    }
    return map;
  }, [events]);

  const days = useMemo(() => getMondayStartGrid(currentYear, currentMonth), [currentYear, currentMonth]);
  const todayKey = toDateKey(today);

  const goToPrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((y) => y - 1);
    } else {
      setCurrentMonth((m) => m - 1);
    }
    setSelectedDay(null);
  };

  const goToNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((y) => y + 1);
    } else {
      setCurrentMonth((m) => m + 1);
    }
    setSelectedDay(null);
  };

  const goToToday = () => {
    setCurrentMonth(today.getMonth());
    setCurrentYear(today.getFullYear());
    setSelectedDay(null);
  };

  const selectedEvents = selectedDay ? (eventsByDate[selectedDay] || []) : [];

  return (
    <div>
      {/* Month Navigation */}
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: "1.5rem"
      }}>
        <button onClick={goToPrevMonth} className="btn btn-secondary" style={{ padding: "0.5rem 1rem", borderRadius: "var(--radius-sm)" }}>
          ◀
        </button>
        <div style={{ textAlign: "center" }}>
          <h3 style={{
            fontSize: "1.35rem",
            fontWeight: "700",
            color: "var(--text-main)",
            margin: 0,
            letterSpacing: "-0.01em"
          }}>
            {MONTHS[currentMonth]} {currentYear}
          </h3>
          <button
            onClick={goToToday}
            style={{
              fontSize: "0.75rem",
              color: "var(--primary-light)",
              cursor: "pointer",
              fontWeight: "600",
              padding: "0.15rem 0.5rem",
              borderRadius: "var(--radius-sm)",
              border: "1px solid var(--primary-light)",
              backgroundColor: "transparent",
              marginTop: "0.35rem"
            }}
          >
            Heute
          </button>
        </div>
        <button onClick={goToNextMonth} className="btn btn-secondary" style={{ padding: "0.5rem 1rem", borderRadius: "var(--radius-sm)" }}>
          ▶
        </button>
      </div>

      {/* Calendar Grid */}
      <div className="card" style={{ padding: "0", overflow: "hidden" }}>
        {/* Weekday Headers */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(7, 1fr)",
          borderBottom: "1px solid var(--surface-border)",
          backgroundColor: "var(--surface)"
        }}>
          {WEEKDAYS.map((wd, i) => (
            <div key={wd} style={{
              padding: "0.6rem 0",
              textAlign: "center",
              fontSize: "0.75rem",
              fontWeight: "700",
              color: i >= 5 ? "var(--primary-light)" : "var(--text-muted)",
              textTransform: "uppercase",
              letterSpacing: "0.05em"
            }}>
              {wd}
            </div>
          ))}
        </div>

        {/* Day Cells */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(7, 1fr)",
        }}>
          {days.map((day, idx) => {
            const key = toDateKey(day.date);
            const isToday = key === todayKey;
            const isSelected = key === selectedDay;
            const dayEvents = eventsByDate[key] || [];
            const isWeekend = idx % 7 >= 5;
            const dayNum = day.date.getDate();

            return (
              <div
                key={idx}
                onClick={() => setSelectedDay(isSelected ? null : key)}
                style={{
                  minHeight: "4.5rem",
                  padding: "0.35rem",
                  borderRight: (idx % 7 < 6) ? "1px solid var(--surface-border)" : "none",
                  borderBottom: "1px solid var(--surface-border)",
                  backgroundColor: isSelected
                    ? "var(--primary-glow)"
                    : isWeekend
                      ? "hsla(var(--hue-primary), 10%, 50%, 0.03)"
                      : "transparent",
                  cursor: dayEvents.length > 0 ? "pointer" : "default",
                  transition: "background-color 0.15s ease",
                  position: "relative"
                }}
              >
                {/* Day Number */}
                <div style={{
                  fontSize: "0.8rem",
                  fontWeight: isToday ? "800" : "500",
                  color: !day.inMonth
                    ? "var(--text-muted)"
                    : isToday
                      ? "var(--primary-light)"
                      : "var(--text-main)",
                  marginBottom: "0.25rem",
                  display: "flex",
                  justifyContent: "center"
                }}>
                  <span style={{
                    ...(isToday ? {
                      backgroundColor: "var(--primary-light)",
                      color: "#fff",
                      borderRadius: "50%",
                      width: "1.6rem",
                      height: "1.6rem",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "0.75rem"
                    } : {}),
                    opacity: day.inMonth ? 1 : 0.35
                  }}>
                    {dayNum}
                  </span>
                </div>

                {/* Event Pills */}
                <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                  {dayEvents.slice(0, 3).map((ev) => {
                    const cfg = TYPE_COLORS[ev.type] || TYPE_COLORS.OVERTIME;
                    const isPending = ev.status === Status.PENDING;
                    return (
                      <div key={ev.id} style={{
                        fontSize: "0.6rem",
                        fontWeight: "600",
                        padding: "1px 3px",
                        borderRadius: "3px",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        ...(isPending ? {
                          backgroundColor: `${cfg.bg}22`,
                          border: `1.5px dashed ${cfg.bg}`,
                          color: cfg.bg,
                        } : {
                          backgroundColor: cfg.bg,
                          color: "#fff",
                        })
                      }}>
                        {ev.employee.name.split(" ")[0].substring(0, 6)}
                      </div>
                    );
                  })}
                  {dayEvents.length > 3 && (
                    <div style={{ fontSize: "0.55rem", color: "var(--text-muted)", textAlign: "center", fontWeight: "600" }}>
                      +{dayEvents.length - 3}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Day Detail Panel */}
      {selectedDay && selectedEvents.length > 0 && (
        <div className="card" style={{
          marginTop: "1rem",
          animation: "slideUp 0.2s forwards"
        }}>
          <h4 style={{
            fontWeight: "700",
            color: "var(--text-main)",
            fontSize: "1rem",
            marginBottom: "1rem"
          }}>
            📅 {new Date(selectedDay + "T00:00:00").toLocaleDateString("de-DE", {
              weekday: "long",
              day: "2-digit",
              month: "long",
              year: "numeric"
            })}
          </h4>

          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {selectedEvents.map((ev) => {
              const cfg = TYPE_COLORS[ev.type] || TYPE_COLORS.OVERTIME;
              const isPending = ev.status === Status.PENDING;
              const isVacation = ev.type === ("VACATION" as RequestType);
              const displayVal = isVacation
                ? `${(ev.hours / 8).toFixed(1).replace(".", ",")} Tage`
                : `${ev.hours.toFixed(2).replace(".", ",")} Std.`;

              return (
                <div key={ev.id} style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "0.75rem",
                  borderRadius: "var(--radius-sm)",
                  backgroundColor: "var(--background)",
                  border: `1px solid var(--surface-border)`,
                  borderLeft: `4px solid ${cfg.bg}`,
                  gap: "0.75rem",
                  flexWrap: "wrap"
                }}>
                  <div style={{ flex: 1, minWidth: "120px" }}>
                    <div style={{ fontWeight: "700", fontSize: "0.95rem", color: "var(--text-main)" }}>
                      {ev.employee.name}
                    </div>
                    <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginTop: "0.15rem" }}>
                      {cfg.emoji} {cfg.label} – {ev.reason}
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <span style={{ fontWeight: "700", color: cfg.bg, fontSize: "0.95rem" }}>
                      {displayVal}
                    </span>
                    <span className={`badge ${isPending ? "badge-pending" : "badge-approved"}`}>
                      {isPending ? "Antrag" : "Genehmigt"}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Legend */}
      <div style={{
        display: "flex",
        flexWrap: "wrap",
        gap: "1rem",
        marginTop: "1.25rem",
        padding: "0.75rem 1rem",
        backgroundColor: "var(--surface)",
        borderRadius: "var(--radius-sm)",
        border: "1px solid var(--surface-border)"
      }}>
        {Object.entries(TYPE_COLORS).map(([key, cfg]) => (
          <div key={key} style={{ display: "flex", alignItems: "center", gap: "0.4rem", fontSize: "0.8rem" }}>
            <span style={{
              width: "0.75rem",
              height: "0.75rem",
              borderRadius: "3px",
              backgroundColor: cfg.bg,
              display: "inline-block",
              flexShrink: 0
            }} />
            <span style={{ color: "var(--text-muted)", fontWeight: "500" }}>
              {cfg.emoji} {cfg.label}
            </span>
          </div>
        ))}
        <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", fontSize: "0.8rem", marginLeft: "auto" }}>
          <span style={{
            width: "0.75rem",
            height: "0.75rem",
            borderRadius: "3px",
            border: "1.5px dashed var(--text-muted)",
            display: "inline-block",
            flexShrink: 0
          }} />
          <span style={{ color: "var(--text-muted)", fontWeight: "500" }}>= Antrag</span>
          <span style={{
            width: "0.75rem",
            height: "0.75rem",
            borderRadius: "3px",
            backgroundColor: "var(--text-muted)",
            display: "inline-block",
            flexShrink: 0,
            marginLeft: "0.5rem"
          }} />
          <span style={{ color: "var(--text-muted)", fontWeight: "500" }}>= Genehmigt</span>
        </div>
      </div>
    </div>
  );
}
