import React, { useEffect, useState } from "react";
import { message } from "antd";
import Sidebar from "../common/Sidebar.jsx";
import axiosInstance, { authHeader } from "../../axiosConfig.js";

const NAV_ITEMS = [
  { label: "Dashboard",    path: "/adminhome",    icon: "🏠" },
  { label: "Users",        path: "/adminusers",   icon: "👥" },
  { label: "Doctors",      path: "/admindoctors", icon: "🩺" },
  { label: "Appointments", path: "/adminappts",   icon: "📅" },
];

const STATUS_STYLE = {
  pending:  { color: "#92632a", bg: "#fdf3e3" },
  approved: { color: "#2d6a4f", bg: "#e8f5ee" },
  rejected: { color: "#7b2d2d", bg: "#fdeaea" },
};

export default function AdminAppointment() {
  const userData = JSON.parse(localStorage.getItem("userData") || "{}");
  const [appointments, setAppointments] = useState([]);
  const [filtered,     setFiltered]     = useState([]);
  const [search,       setSearch]       = useState("");
  const [tab,          setTab]          = useState("all");
  const [loading,      setLoading]      = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const { data } = await axiosInstance.get("/api/admin/getallAppointmentsAdmin", { headers: authHeader() });
        setAppointments(data.data);
      } catch { message.error("Failed to load appointments."); }
      finally  { setLoading(false); }
    };
    fetch();
  }, []);

  useEffect(() => {
    const q   = search.toLowerCase();
    const src = tab === "all" ? appointments : appointments.filter((a) => a.status === tab);
    setFiltered(src.filter((a) =>
      a.date?.toLowerCase().includes(q) ||
      a.status?.toLowerCase().includes(q) ||
      a._id?.toLowerCase().includes(q)
    ));
  }, [search, tab, appointments]);

  const tabs = [
    { key: "all",      label: "All",      count: appointments.length },
    { key: "pending",  label: "Pending",  count: appointments.filter((a) => a.status === "pending").length  },
    { key: "approved", label: "Approved", count: appointments.filter((a) => a.status === "approved").length },
    { key: "rejected", label: "Rejected", count: appointments.filter((a) => a.status === "rejected").length },
  ];

  return (
    <div className="dashboard-layout">
      <Sidebar role="admin" navItems={NAV_ITEMS} userName={userData.fullName || ""} notifCount={0} />

      <main className="dashboard-main">
        <header className="dashboard-header">
          <h3>All Appointments</h3>
          <input
            placeholder="Search by date, status, ID…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: "240px", padding: "0.6rem 1rem",
              border: "1.5px solid rgba(171,178,144,0.35)",
              borderRadius: "var(--radius-sm)", fontFamily: "var(--font-body)",
              fontSize: "0.85rem", color: "var(--text-dark)", background: "#fff", outline: "none",
            }}
          />
        </header>

        <div className="dashboard-content">
          {/* Tab bar */}
          <div style={{
            display: "flex", gap: "0", marginBottom: "1.75rem",
            background: "var(--surface-mid)", borderRadius: "var(--radius-sm)",
            padding: "0.25rem", width: "fit-content",
          }}>
            {tabs.map((t) => (
              <button key={t.key} onClick={() => setTab(t.key)} style={{
                padding: "0.5rem 1.25rem", borderRadius: "var(--radius-sm)",
                border: "none", background: tab === t.key ? "#fff" : "transparent",
                boxShadow: tab === t.key ? "var(--shadow-sm)" : "none",
                fontFamily: "var(--font-body)", fontSize: "0.82rem",
                fontWeight: tab === t.key ? 500 : 400,
                color: tab === t.key ? "var(--text-dark)" : "var(--text-light)",
                cursor: "pointer", transition: "all 0.2s ease",
                display: "flex", alignItems: "center", gap: "0.5rem",
              }}>
                {t.label}
                {t.count > 0 && (
                  <span style={{
                    background: tab === t.key ? "var(--secondary)" : "var(--neutral)",
                    color: "#fff", borderRadius: "10px",
                    padding: "0.05rem 0.5rem", fontSize: "0.68rem", fontWeight: 600,
                  }}>
                    {t.count}
                  </span>
                )}
              </button>
            ))}
          </div>

          {loading ? (
            <Shimmer rows={5} />
          ) : filtered.length === 0 ? (
            <EmptyState />
          ) : (
            <div className="card-brand" style={{ overflow: "hidden" }}>
              {/* Table header */}
              <div style={{
                display: "grid", gridTemplateColumns: "1.5fr 1.5fr 1.5fr 1fr",
                padding: "0.85rem 1.5rem",
                background: "var(--surface-mid)",
                borderBottom: "2px solid rgba(171,178,144,0.2)",
              }}>
                {["Appointment ID","Date","Has Document","Status"].map((h) => (
                  <div key={h} style={{ fontFamily: "var(--font-body)", fontSize: "0.7rem", fontWeight: 500, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-light)" }}>
                    {h}
                  </div>
                ))}
              </div>

              {/* Rows */}
              {filtered.map((appt, i) => {
                const ss = STATUS_STYLE[appt.status] || STATUS_STYLE.pending;
                return (
                  <div
                    key={appt._id}
                    className={`animate-fade-up delay-${(i % 4) + 1}`}
                    style={{
                      display: "grid", gridTemplateColumns: "1.5fr 1.5fr 1.5fr 1fr",
                      padding: "1rem 1.5rem", alignItems: "center",
                      borderBottom: "1px solid rgba(171,178,144,0.12)",
                      transition: "background 0.2s",
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = "rgba(249,234,215,0.3)"}
                    onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                  >
                    {/* ID */}
                    <div style={{ fontFamily: "var(--font-body)", fontSize: "0.75rem", color: "var(--text-light)", fontFamily: "monospace" }}>
                      #{appt._id.slice(-8).toUpperCase()}
                    </div>

                    {/* Date */}
                    <div style={{ fontFamily: "var(--font-body)", fontSize: "0.875rem", color: "var(--text-dark)", fontWeight: 500 }}>
                      📅 {appt.date}
                    </div>

                    {/* Document */}
                    <div>
                      <span style={{
                        padding: "0.25rem 0.75rem", borderRadius: "20px",
                        fontSize: "0.7rem", fontWeight: 500, letterSpacing: "0.06em",
                        textTransform: "uppercase", fontFamily: "var(--font-body)",
                        color: appt.document?.path ? "#2d6a4f" : "#748469",
                        background: appt.document?.path ? "#e8f5ee" : "#f0f3ec",
                      }}>
                        {appt.document?.path ? "📎 Attached" : "None"}
                      </span>
                    </div>

                    {/* Status */}
                    <div>
                      <span style={{
                        padding: "0.25rem 0.75rem", borderRadius: "20px",
                        fontSize: "0.7rem", fontWeight: 500, letterSpacing: "0.06em",
                        textTransform: "uppercase", fontFamily: "var(--font-body)",
                        color: ss.color, background: ss.bg,
                      }}>
                        {appt.status}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

function Shimmer({ rows }) {
  return (
    <div className="card-brand" style={{ overflow: "hidden" }}>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} style={{
          height: "60px", borderBottom: "1px solid rgba(171,178,144,0.12)",
          background: "linear-gradient(90deg, var(--surface-mid) 25%, var(--surface) 50%, var(--surface-mid) 75%)",
          backgroundSize: "200% 100%", animation: "shimmer 1.4s ease-in-out infinite",
        }} />
      ))}
      <style>{`@keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }`}</style>
    </div>
  );
}

function EmptyState() {
  return (
    <div style={{ textAlign: "center", padding: "5rem 2rem" }}>
      <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>📅</div>
      <h3 style={{ fontFamily: "var(--font-display)", fontWeight: 400, fontSize: "1.5rem", color: "var(--text-dark)", marginBottom: "0.5rem" }}>
        No appointments yet
      </h3>
      <p style={{ fontFamily: "var(--font-body)", color: "var(--text-light)", fontWeight: 300 }}>
        Appointments will appear here once patients start booking.
      </p>
    </div>
  );
}
