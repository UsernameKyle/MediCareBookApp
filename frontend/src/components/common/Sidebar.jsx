import React from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { message } from "antd";

export default function Sidebar({ role = "user", navItems = [], userName = "", notifCount = 0 }) {
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userData");
    message.success("Signed out successfully");
    navigate("/");
  };

  const roleLabel = {
    user:   "Patient Portal",
    doctor: "Doctor Portal",
    admin:  "Admin Console",
  }[role];

  return (
    <aside className="sidebar">
      {/* Logo — click goes to own dashboard, not landing page */}
      <div className="sidebar-logo">
        <Link
          to={role === "admin" ? "/adminhome" : "/userhome"}
          style={{ textDecoration: "none" }}
        >
          <h2 style={{
            fontFamily: "var(--font-display)",
            fontSize: "1.5rem",
            fontWeight: 400,
            margin: 0,
            letterSpacing: "0.02em",
            lineHeight: 1.2,
          }}>
            <span style={{ color: "#F9EAD7" }}>Medi</span><span style={{ color: "#ABB290" }}>Care</span><span style={{ color: "#F9EAD7" }}>Book</span>
          </h2>
        </Link>
        <span style={{
          display: "block",
          fontFamily: "var(--font-body)",
          fontSize: "0.68rem",
          letterSpacing: "0.14em",
          textTransform: "uppercase",
          color: "var(--neutral)",
          marginTop: "0.3rem",
        }}>
          {roleLabel}
        </span>
      </div>

      {/* Nav */}
      <ul className="sidebar-nav">
        {navItems.map((item) => (
          <li key={item.path}>
            <Link
              to={item.path}
              className={location.pathname === item.path ? "active" : ""}
            >
              <span className="nav-icon">{item.icon}</span>
              {item.label}
            </Link>
          </li>
        ))}

        {/* Notifications */}
        <li>
          <Link
            to="/notification"
            className={location.pathname === "/notification" ? "active" : ""}
          >
            <span className="nav-icon">🔔</span>
            Notifications
            {notifCount > 0 && (
              <span style={{
                marginLeft: "auto",
                background: "var(--primary)",
                color: "var(--dark)",
                fontSize: "0.65rem",
                fontWeight: 600,
                padding: "0.15rem 0.5rem",
                borderRadius: "10px",
                fontFamily: "var(--font-body)",
              }}>
                {notifCount}
              </span>
            )}
          </Link>
        </li>
      </ul>

      {/* Footer */}
      <div className="sidebar-footer">
        <div style={{
          fontFamily: "var(--font-body)",
          fontSize: "0.78rem",
          color: "var(--neutral)",
          marginBottom: "1rem",
          letterSpacing: "0.03em",
        }}>
          <div style={{ color: "var(--accent)", fontWeight: 500, marginBottom: "0.2rem" }}>
            {userName}
          </div>
          <div style={{ textTransform: "capitalize" }}>{role}</div>
        </div>

        <button
          onClick={handleLogout}
          style={{
            display: "flex", alignItems: "center", gap: "0.6rem",
            width: "100%", padding: "0.7rem 1rem",
            background: "rgba(249,234,215,0.06)",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: "var(--radius-sm)",
            color: "var(--neutral)", fontFamily: "var(--font-body)",
            fontSize: "0.8rem", letterSpacing: "0.06em",
            textTransform: "uppercase", cursor: "pointer",
            transition: "all 0.3s ease",
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background = "rgba(249,234,215,0.12)";
            e.currentTarget.style.color = "var(--accent)";
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = "rgba(249,234,215,0.06)";
            e.currentTarget.style.color = "var(--neutral)";
          }}
        >
          <span>→</span> Sign Out
        </button>
      </div>
    </aside>
  );
}
