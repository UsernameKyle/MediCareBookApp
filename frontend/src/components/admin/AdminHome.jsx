import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { message } from "antd";
import Sidebar from "../common/Sidebar.jsx";
import axiosInstance, { authHeader } from "../../axiosConfig.js";

const NAV_ITEMS = [
  { label: "Dashboard",    path: "/adminhome",    icon: "🏠" },
  { label: "Users",        path: "/adminusers",   icon: "👥" },
  { label: "Doctors",      path: "/admindoctors", icon: "🩺" },
  { label: "Appointments", path: "/adminappts",   icon: "📅" },
];

export default function AdminHome() {
  const navigate  = useNavigate();
  const userData  = JSON.parse(localStorage.getItem("userData") || "{}");

  const [stats,   setStats]   = useState({ users: 0, doctors: 0, pending: 0, appointments: 0 });
  const [loading, setLoading] = useState(true);
  const [notifCount, setNotifCount] = useState(0);

  useEffect(() => {
    const fetch = async () => {
      try {
        const [uRes, dRes, aRes, meRes] = await Promise.all([
          axiosInstance.get("/api/admin/getallusers",             { headers: authHeader() }),
          axiosInstance.get("/api/admin/getalldoctors",           { headers: authHeader() }),
          axiosInstance.get("/api/admin/getallAppointmentsAdmin", { headers: authHeader() }),
          axiosInstance.post("/api/user/getuserdata", {},          { headers: authHeader() }),
        ]);
        const pending = dRes.data.data.filter((d) => d.status === "pending").length;
        setStats({
          users:        uRes.data.data.length,
          doctors:      dRes.data.data.length,
          pending,
          appointments: aRes.data.data.length,
        });
        setNotifCount(meRes.data.data.notification?.length || 0);
      } catch {
        message.error("Failed to load dashboard stats.");
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [navigate]);

  const statCards = [
    { label: "Total Users",          value: stats.users,        icon: "👥", color: "#748469",  path: "/adminusers"   },
    { label: "Total Doctors",        value: stats.doctors,      icon: "🩺", color: "#2d6a4f",  path: "/admindoctors" },
    { label: "Pending Applications", value: stats.pending,      icon: "⏳", color: "#92632a",  path: "/admindoctors" },
    { label: "Total Appointments",   value: stats.appointments, icon: "📅", color: "#3d4a38",  path: "/adminappts"   },
  ];

  return (
    <div className="dashboard-layout">
      <Sidebar role="admin" navItems={NAV_ITEMS} userName={userData.fullName || ""} notifCount={notifCount} />

      <main className="dashboard-main">
        <header className="dashboard-header">
          <h3>Admin Dashboard</h3>
          <div style={{ fontFamily: "var(--font-body)", fontSize: "0.8rem", color: "var(--text-light)" }}>
            {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
          </div>
        </header>

        <div className="dashboard-content">
          {/* Welcome banner */}
          <div className="animate-fade-up" style={{
            background: "var(--dark)", borderRadius: "var(--radius-lg)",
            padding: "2.5rem 3rem", marginBottom: "2rem",
            position: "relative", overflow: "hidden",
          }}>
            <div style={{ position: "absolute", top: "-40px", right: "-40px", width: "240px", height: "240px", borderRadius: "50%", background: "rgba(171,178,144,0.1)" }} />
            <div style={{ position: "absolute", bottom: "-30px", right: "20%", width: "160px", height: "160px", borderRadius: "50%", background: "rgba(249,234,215,0.06)" }} />
            <div style={{ position: "relative", zIndex: 1 }}>
              <p style={{ fontFamily: "var(--font-body)", fontSize: "0.75rem", letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--primary)", marginBottom: "0.5rem" }}>
                Admin Console
              </p>
              <h2 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(1.6rem,3vw,2.4rem)", fontWeight: 300, color: "var(--accent)", marginBottom: "0.75rem" }}>
                Welcome, {userData.fullName}
              </h2>
              <p style={{ fontFamily: "var(--font-body)", fontSize: "0.9rem", fontWeight: 300, color: "var(--neutral)", maxWidth: "480px", lineHeight: 1.7 }}>
                Manage users, review doctor applications, and oversee all appointments from this console.
              </p>
            </div>
          </div>

          {/* Stat cards */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1.25rem", marginBottom: "2rem" }}>
            {statCards.map((s, i) => (
              <div
                key={s.label}
                className={`card-brand animate-fade-up delay-${i + 1}`}
                onClick={() => navigate(s.path)}
                style={{ padding: "1.75rem", cursor: "pointer" }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div>
                    <div style={{ fontFamily: "var(--font-display)", fontSize: "2.2rem", fontWeight: 300, color: s.color, lineHeight: 1, marginBottom: "0.5rem" }}>
                      {loading ? "—" : s.value}
                    </div>
                    <div style={{ fontFamily: "var(--font-body)", fontSize: "0.75rem", fontWeight: 500, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--text-light)" }}>
                      {s.label}
                    </div>
                  </div>
                  <span style={{ fontSize: "1.5rem", opacity: 0.5 }}>{s.icon}</span>
                </div>
                {s.label === "Pending Applications" && stats.pending > 0 && (
                  <div style={{ marginTop: "1rem", paddingTop: "1rem", borderTop: "1px solid rgba(171,178,144,0.15)" }}>
                    <span style={{ fontFamily: "var(--font-body)", fontSize: "0.72rem", color: "#92632a", background: "#fdf3e3", padding: "0.2rem 0.6rem", borderRadius: "10px" }}>
                      Needs review
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Quick nav */}
          <div className="animate-fade-up delay-3">
            <h4 style={{ fontFamily: "var(--font-display)", fontWeight: 400, fontSize: "1.2rem", color: "var(--text-dark)", marginBottom: "1rem" }}>
              Quick Actions
            </h4>
            <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
              <button onClick={() => navigate("/admindoctors")} className="btn-brand">🩺 Review Applications</button>
              <button onClick={() => navigate("/adminusers")}   className="btn-brand-outline">👥 Manage Users</button>
              <button onClick={() => navigate("/adminappts")}   className="btn-accent">📅 View Appointments</button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
