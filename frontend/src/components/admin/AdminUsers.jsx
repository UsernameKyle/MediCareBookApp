import React, { useEffect, useState } from "react";
import { Select, message } from "antd";
import Sidebar from "../common/Sidebar.jsx";
import axiosInstance, { authHeader } from "../../axiosConfig.js";

const { Option } = Select;

const NAV_ITEMS = [
  { label: "Dashboard",    path: "/adminhome",    icon: "🏠" },
  { label: "Users",        path: "/adminusers",   icon: "👥" },
  { label: "Doctors",      path: "/admindoctors", icon: "🩺" },
  { label: "Appointments", path: "/adminappts",   icon: "📅" },
];

const TYPE_STYLE = {
  admin: { color: "#3d4a38", bg: "#e8ede5" },
  user:  { color: "#748469", bg: "#f0f3ec" },
};

const colors = ["#748469","#ABB290","#92632a","#2d6a4f","#3d4a38"];

const initials = (name = "") =>
  name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase();

/* ── Create User modal — defined outside to prevent remount ──────── */
function CreateUserModal({ onClose, onCreated }) {
  const [loading, setLoading] = useState(false);
  const [focused, setFocused] = useState(null);
  const [fields,  setFields]  = useState({ fullName: "", email: "", password: "", phone: "", type: "user" });
  const [errors,  setErrors]  = useState({});

  const setField = (name, value) => {
    setFields((p) => ({ ...p, [name]: value }));
    if (errors[name]) setErrors((p) => ({ ...p, [name]: "" }));
  };

  const validate = () => {
    const e = {};
    if (!fields.fullName.trim()) e.fullName = "Required";
    if (!fields.email.trim())    e.email    = "Required";
    else if (!/\S+@\S+\.\S+/.test(fields.email)) e.email = "Invalid email";
    if (!fields.password)        e.password = "Required";
    else if (fields.password.length < 6) e.password = "Min. 6 characters";
    if (!fields.phone.trim())    e.phone    = "Required";
    return e;
  };

  const onSubmit = async () => {
    const e = validate();
    if (Object.keys(e).length > 0) { setErrors(e); return; }
    try {
      setLoading(true);
      await axiosInstance.post("/api/admin/createuser", fields, { headers: authHeader() });
      message.success(`${fields.type === "admin" ? "Admin" : "User"} account created successfully`);
      onCreated();
      onClose();
    } catch (err) {
      message.error(err.response?.data?.message || "Failed to create account.");
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = (name) => ({
    width: "100%", padding: "0.75rem 1rem", boxSizing: "border-box",
    border: `1.5px solid ${focused === name ? "var(--secondary)" : errors[name] ? "#c0392b" : "rgba(171,178,144,0.35)"}`,
    borderRadius: "var(--radius-sm)", fontFamily: "var(--font-body)",
    fontSize: "0.875rem", fontWeight: 300, color: "var(--text-dark)",
    background: "#fff", outline: "none",
    boxShadow: focused === name ? "0 0 0 3px rgba(116,132,105,0.12)" : "none",
    transition: "border-color 0.2s, box-shadow 0.2s",
  });

  const labelStyle = {
    display: "block", fontFamily: "var(--font-body)", fontSize: "0.7rem",
    fontWeight: 500, letterSpacing: "0.1em", textTransform: "uppercase",
    color: "var(--text-mid)", marginBottom: "0.4rem",
  };

  const errMsg = (name) => errors[name] ? (
    <div style={{ fontFamily: "var(--font-body)", fontSize: "0.72rem", color: "#c0392b", marginTop: "0.25rem" }}>
      {errors[name]}
    </div>
  ) : null;

  return (
    /* Backdrop */
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, background: "rgba(44,51,40,0.55)",
        backdropFilter: "blur(4px)", zIndex: 1000,
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: "1rem",
      }}
    >
      {/* Modal card — stop propagation so clicking inside doesn't close */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="animate-fade-up"
        style={{
          background: "#fff", borderRadius: "var(--radius-lg)",
          padding: "2.5rem", width: "100%", maxWidth: "480px",
          boxShadow: "var(--shadow-lg)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.75rem" }}>
          <div>
            <h3 style={{ fontFamily: "var(--font-display)", fontWeight: 400, fontSize: "1.5rem", color: "var(--text-dark)", margin: 0 }}>
              Create Account
            </h3>
            <p style={{ fontFamily: "var(--font-body)", fontSize: "0.82rem", color: "var(--text-light)", margin: "0.3rem 0 0", fontWeight: 300 }}>
              Admin-created accounts can be assigned any role.
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "none", border: "none", fontSize: "1.2rem",
              cursor: "pointer", color: "var(--text-light)", lineHeight: 1,
              padding: "0.25rem",
            }}
          >
            ✕
          </button>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
          <div style={{ marginBottom: "0.25rem" }}>
            <label style={labelStyle}>Full name</label>
            <input value={fields.fullName} placeholder="Juan Dela Cruz"
              onChange={(e) => setField("fullName", e.target.value)}
              onFocus={() => setFocused("fullName")} onBlur={() => setFocused(null)}
              style={inputStyle("fullName")} />
            {errMsg("fullName")}
          </div>
          <div style={{ marginBottom: "0.25rem" }}>
            <label style={labelStyle}>Phone</label>
            <input value={fields.phone} placeholder="09001234567"
              onChange={(e) => setField("phone", e.target.value)}
              onFocus={() => setFocused("phone")} onBlur={() => setFocused(null)}
              style={inputStyle("phone")} />
            {errMsg("phone")}
          </div>
        </div>

        <div style={{ marginBottom: "1rem" }}>
          <label style={labelStyle}>Email address</label>
          <input type="email" value={fields.email} placeholder="you@example.com"
            onChange={(e) => setField("email", e.target.value)}
            onFocus={() => setFocused("email")} onBlur={() => setFocused(null)}
            style={inputStyle("email")} />
          {errMsg("email")}
        </div>

        <div style={{ marginBottom: "1rem" }}>
          <label style={labelStyle}>Password</label>
          <input type="password" value={fields.password} placeholder="Min. 6 characters"
            autoComplete="new-password"
            onChange={(e) => setField("password", e.target.value)}
            onFocus={() => setFocused("password")} onBlur={() => setFocused(null)}
            style={inputStyle("password")} />
          {errMsg("password")}
        </div>

        {/* Role — only visible here, never on public register */}
        <div style={{ marginBottom: "1.5rem" }}>
          <label style={labelStyle}>Account role</label>
          <div style={{
            padding: "0.6rem 0.85rem",
            background: "rgba(249,234,215,0.5)",
            border: "1px solid rgba(171,178,144,0.3)",
            borderRadius: "var(--radius-sm)",
            fontFamily: "var(--font-body)", fontSize: "0.78rem",
            color: "var(--text-mid)", marginBottom: "0.5rem", lineHeight: 1.5,
          }}>
            ⚠️ Admin accounts have full system access. Only create admin accounts for trusted personnel.
          </div>
          <Select
            value={fields.type}
            onChange={(val) => setField("type", val)}
            style={{ width: "100%" }}
            styles={{
              selector: {
                border: "1.5px solid rgba(171,178,144,0.35)",
                borderRadius: "var(--radius-sm)",
                fontFamily: "var(--font-body)",
              }
            }}
          >
            <Option value="user">Patient / User</Option>
            <Option value="admin">Administrator</Option>
          </Select>
        </div>

        <div style={{ display: "flex", gap: "0.75rem" }}>
          <button
            onClick={onSubmit}
            disabled={loading}
            className="btn-brand"
            style={{ flex: 1, justifyContent: "center", opacity: loading ? 0.7 : 1, cursor: loading ? "not-allowed" : "pointer" }}
          >
            {loading ? "Creating…" : "Create Account"}
          </button>
          <button onClick={onClose} className="btn-brand-outline">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Main component ──────────────────────────────────────────────── */
export default function AdminUsers() {
  const userData = JSON.parse(localStorage.getItem("userData") || "{}");
  const [users,      setUsers]      = useState([]);
  const [filtered,   setFiltered]   = useState([]);
  const [search,     setSearch]     = useState("");
  const [loading,    setLoading]    = useState(true);
  const [showModal,  setShowModal]  = useState(false);

  const fetchUsers = async () => {
    try {
      const { data } = await axiosInstance.get("/api/admin/getallusers", { headers: authHeader() });
      setUsers(data.data);
      setFiltered(data.data);
    } catch { message.error("Failed to load users."); }
    finally  { setLoading(false); }
  };

  useEffect(() => { fetchUsers(); }, []);

  useEffect(() => {
    const q = search.toLowerCase();
    setFiltered(users.filter((u) =>
      u.fullName.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      u.type.toLowerCase().includes(q)
    ));
  }, [search, users]);

  return (
    <div className="dashboard-layout">
      <Sidebar role="admin" navItems={NAV_ITEMS} userName={userData.fullName || ""} notifCount={0} />

      <main className="dashboard-main">
        <header className="dashboard-header">
          <h3>Users</h3>
          <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
            <input
              placeholder="Search by name, email or role…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                width: "240px", padding: "0.6rem 1rem",
                border: "1.5px solid rgba(171,178,144,0.35)",
                borderRadius: "var(--radius-sm)", fontFamily: "var(--font-body)",
                fontSize: "0.85rem", color: "var(--text-dark)", background: "#fff", outline: "none",
              }}
            />
            <button
              onClick={() => setShowModal(true)}
              className="btn-brand"
              style={{ padding: "0.6rem 1.2rem", fontSize: "0.78rem", whiteSpace: "nowrap" }}
            >
              + Create Account
            </button>
          </div>
        </header>

        <div className="dashboard-content">
          {loading ? <Shimmer rows={6} /> : (
            <>
              <p style={{ fontFamily: "var(--font-body)", fontSize: "0.8rem", color: "var(--text-light)", marginBottom: "1.5rem" }}>
                {filtered.length} user{filtered.length !== 1 ? "s" : ""} found
              </p>

              <div className="card-brand" style={{ overflow: "hidden" }}>
                {/* Table header */}
                <div style={{
                  display: "grid", gridTemplateColumns: "2.5fr 2fr 1fr 1fr",
                  padding: "0.85rem 1.5rem", background: "var(--surface-mid)",
                  borderBottom: "2px solid rgba(171,178,144,0.2)",
                }}>
                  {["User","Email","Role","Doctor"].map((h) => (
                    <div key={h} style={{ fontFamily: "var(--font-body)", fontSize: "0.7rem", fontWeight: 500, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-light)" }}>
                      {h}
                    </div>
                  ))}
                </div>

                {filtered.length === 0 ? (
                  <div style={{ textAlign: "center", padding: "3rem", color: "var(--text-light)", fontFamily: "var(--font-body)" }}>
                    No users match your search.
                  </div>
                ) : (
                  filtered.map((u, i) => {
                    const ts = TYPE_STYLE[u.type] || TYPE_STYLE.user;
                    const color = colors[i % colors.length];
                    return (
                      <div
                        key={u._id}
                        className={`animate-fade-up delay-${(i % 4) + 1}`}
                        style={{
                          display: "grid", gridTemplateColumns: "2.5fr 2fr 1fr 1fr",
                          padding: "1rem 1.5rem", alignItems: "center",
                          borderBottom: "1px solid rgba(171,178,144,0.12)",
                          transition: "background 0.2s",
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = "rgba(249,234,215,0.3)"}
                        onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: "0.85rem" }}>
                          <div style={{
                            width: "38px", height: "38px", borderRadius: "50%", background: color,
                            display: "flex", alignItems: "center", justifyContent: "center",
                            fontFamily: "var(--font-display)", fontSize: "0.9rem", color: "#fff", flexShrink: 0,
                          }}>
                            {initials(u.fullName)}
                          </div>
                          <div>
                            <div style={{ fontFamily: "var(--font-body)", fontSize: "0.9rem", fontWeight: 500, color: "var(--text-dark)" }}>
                              {u.fullName}
                            </div>
                            <div style={{ fontFamily: "var(--font-body)", fontSize: "0.75rem", color: "var(--text-light)" }}>
                              Joined {new Date(u.createdAt).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                        <div style={{ fontFamily: "var(--font-body)", fontSize: "0.85rem", color: "var(--text-mid)" }}>{u.email}</div>
                        <div>
                          <span style={{ padding: "0.25rem 0.75rem", borderRadius: "20px", fontSize: "0.7rem", fontWeight: 500, letterSpacing: "0.06em", textTransform: "uppercase", fontFamily: "var(--font-body)", color: ts.color, background: ts.bg }}>
                            {u.type}
                          </span>
                        </div>
                        <div>
                          <span style={{ padding: "0.25rem 0.75rem", borderRadius: "20px", fontSize: "0.7rem", fontWeight: 500, letterSpacing: "0.06em", textTransform: "uppercase", fontFamily: "var(--font-body)", color: u.isdoctor ? "#2d6a4f" : "#748469", background: u.isdoctor ? "#e8f5ee" : "#f0f3ec" }}>
                            {u.isdoctor ? "Doctor" : "Patient"}
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </>
          )}
        </div>
      </main>

      {showModal && (
        <CreateUserModal
          onClose={() => setShowModal(false)}
          onCreated={fetchUsers}
        />
      )}
    </div>
  );
}

function Shimmer({ rows }) {
  return (
    <div className="card-brand" style={{ overflow: "hidden" }}>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} style={{
          height: "64px", borderBottom: "1px solid rgba(171,178,144,0.12)",
          background: "linear-gradient(90deg, var(--surface-mid) 25%, var(--surface) 50%, var(--surface-mid) 75%)",
          backgroundSize: "200% 100%", animation: "shimmer 1.4s ease-in-out infinite",
        }} />
      ))}
      <style>{`@keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }`}</style>
    </div>
  );
}
