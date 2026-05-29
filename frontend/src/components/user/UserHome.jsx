import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { message } from "antd";
import Sidebar from "../common/Sidebar.jsx";
import { useUserNav } from "../common/useUserNav.js";
import axiosInstance, { authHeader } from "../../axiosConfig.js";

export default function UserHome() {
  const navigate          = useNavigate();
  const { role, navItems, userData: localUser } = useUserNav();
  const [user,    setUser]    = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const { data } = await axiosInstance.post(
          "/api/user/getuserdata", {}, { headers: authHeader() }
        );
        const fetched = data.data;
        setUser(fetched);

        // Keep localStorage in sync so other pages read the latest isdoctor flag
        const stored = JSON.parse(localStorage.getItem("userData") || "{}");
        if (stored.isdoctor !== fetched.isdoctor) {
          localStorage.setItem("userData", JSON.stringify({ ...stored, isdoctor: fetched.isdoctor }));
        }
      } catch {
        message.error("Session expired. Please sign in again.");
        localStorage.clear();
        navigate("/login");
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, [navigate]);

  if (loading) return <LoadingScreen />;

  const notifCount = user?.notification?.length || 0;
  const isDoctor   = user?.isdoctor === true;

  const stats = [
    { value: notifCount,                        label: "Unread Notifications", icon: "🔔", color: "#748469" },
    { value: user?.seennotification?.length||0, label: "Past Notifications",   icon: "📬", color: "#ABB290" },
    { value: user?.documents?.length||0,         label: "Documents Uploaded",   icon: "📄", color: "#92632a" },
    { value: isDoctor ? "Doctor" : "Patient",   label: "Account Status",       icon: "⚕️", color: "#2d6a4f" },
  ];

  // Nav recomputed after fetch to reflect server-confirmed isdoctor
  const freshNav = [
    { label: "Dashboard",       path: "/userhome",    icon: "⚕️" },
    { label: "Find Doctors",    path: "/doctors",      icon: "🔍" },
    { label: "My Appointments", path: "/appointments", icon: "📅" },
    ...(!isDoctor ? [{ label: "Apply as Doctor", path: "/applydoctor", icon: "🩺" }] : []),
    { label: "My Documents",    path: "/documents",    icon: "📄" },
    { label: "Settings",        path: "/settings",     icon: "⚙️" },
  ];

  return (
    <div className="dashboard-layout">
      <Sidebar
        role={isDoctor ? "doctor" : "user"}
        navItems={freshNav}
        userName={user?.fullName || ""}
        notifCount={notifCount}
      />

      <main className="dashboard-main">
        <header className="dashboard-header">
          <h3>Dashboard</h3>
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
                Welcome back
              </p>
              <h2 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(1.6rem,3vw,2.4rem)", fontWeight: 300, color: "var(--accent)", marginBottom: "0.75rem" }}>
                {user?.fullName}
              </h2>
              <p style={{ fontFamily: "var(--font-body)", fontSize: "0.9rem", fontWeight: 300, color: "var(--neutral)", maxWidth: "480px", lineHeight: 1.7 }}>
                {isDoctor
                  ? "Your doctor profile is active. You can still find doctors and book appointments for yourself."
                  : "Find a specialist, book an appointment, or apply to become a doctor on our platform."}
              </p>
            </div>
          </div>

          {/* Stats */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1.25rem", marginBottom: "2rem" }}>
            {stats.map((s, i) => (
              <div key={s.label} className={`card-brand animate-fade-up delay-${i + 1}`} style={{ padding: "1.75rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div>
                    <div style={{ fontFamily: "var(--font-display)", fontSize: "2rem", fontWeight: 300, color: s.color, lineHeight: 1, marginBottom: "0.5rem" }}>
                      {s.value}
                    </div>
                    <div style={{ fontFamily: "var(--font-body)", fontSize: "0.75rem", fontWeight: 500, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--text-light)" }}>
                      {s.label}
                    </div>
                  </div>
                  <span style={{ fontSize: "1.5rem", opacity: 0.6 }}>{s.icon}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Quick actions */}
          <div className="animate-fade-up delay-2">
            <h4 style={{ fontFamily: "var(--font-display)", fontWeight: 400, fontSize: "1.2rem", color: "var(--text-dark)", marginBottom: "1rem" }}>
              Quick Actions
            </h4>
            <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
              <button onClick={() => navigate("/doctors")}      className="btn-brand">🔍 Find a Doctor</button>
              <button onClick={() => navigate("/appointments")} className="btn-brand-outline">📅 My Appointments</button>
              {!isDoctor && (
                <button onClick={() => navigate("/applydoctor")} className="btn-accent">🩺 Apply as Doctor</button>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function LoadingScreen() {
  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--surface)" }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontFamily: "var(--font-display)", fontSize: "2rem", color: "var(--text-dark)", marginBottom: "1rem", animation: "pulse 1.5s ease-in-out infinite" }}>
          MediCareBook
        </div>
        <div style={{ fontFamily: "var(--font-body)", fontSize: "0.8rem", letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--text-light)" }}>
          Loading your dashboard…
        </div>
      </div>
    </div>
  );
}
