import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { message } from "antd";
import Sidebar from "./Sidebar.jsx";
import axiosInstance, { authHeader } from "../../axiosConfig.js";

const USER_NAV = [
  { label: "Dashboard",       path: "/userhome",    icon: "⚕️" },
  { label: "Find Doctors",    path: "/doctors",      icon: "🔍" },
  { label: "My Appointments", path: "/appointments", icon: "📅" },
  { label: "Apply as Doctor", path: "/applydoctor",  icon: "🩺" },
  { label: "My Documents",    path: "/documents",    icon: "📄" },
  { label: "Settings",        path: "/settings",     icon: "⚙️" },
];

const ADMIN_NAV = [
  { label: "Dashboard",    path: "/adminhome",    icon: "🏠" },
  { label: "Users",        path: "/adminusers",   icon: "👥" },
  { label: "Doctors",      path: "/admindoctors", icon: "🩺" },
  { label: "Appointments", path: "/adminappts",   icon: "📅" },
];

const DOCTOR_NAV = [
  { label: "Dashboard",    path: "/doctorhome",         icon: "⚕️" },
  { label: "Appointments", path: "/doctorapointments",  icon: "📅" },
  { label: "Settings",     path: "/settings",           icon: "⚙️" },
];

const TYPE_MAP = {
  "doctor-application":      { icon: "🩺", color: "#748469", bg: "#f0f3ec" },
  "doctor-account-approved": { icon: "✅", color: "#2d6a4f", bg: "#e8f5ee" },
  "doctor-account-rejected": { icon: "❌", color: "#7b2d2d", bg: "#fdeaea" },
  "new-appointment":         { icon: "📅", color: "#92632a", bg: "#fdf3e3" },
  "appointment-approved":    { icon: "✅", color: "#2d6a4f", bg: "#e8f5ee" },
  "appointment-rejected":    { icon: "❌", color: "#7b2d2d", bg: "#fdeaea" },
};

const typeStyle = (type) =>
  TYPE_MAP[type] || { icon: "🔔", color: "#748469", bg: "#f0f3ec" };

function timeAgo(dateStr) {
  if (!dateStr) return "";
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1)  return "Just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

/* ── Single notification card ─────────────────────────────────────── */
function NotifCard({ notif, seen, index, onMarkRead, onDelete, isActing }) {
  const { icon, color, bg } = typeStyle(notif.type);

  return (
    <div
      className={`animate-fade-up delay-${(index % 4) + 1}`}
      style={{
        display: "flex",
        gap: "1rem",
        alignItems: "flex-start",
        padding: "1.25rem 1.5rem",
        background: seen ? "#fff" : bg,
        border: `1px solid ${seen ? "rgba(171,178,144,0.15)" : color + "33"}`,
        borderRadius: "var(--radius-md)",
        position: "relative",
        marginBottom: "0.75rem",
        opacity: seen ? 0.8 : 1,
        transition: "opacity 0.2s ease",
      }}
    >
      {/* Unread dot */}
      {!seen && (
        <div style={{
          position: "absolute", top: "1.1rem", right: "1.25rem",
          width: "8px", height: "8px", borderRadius: "50%", background: color,
        }} />
      )}

      {/* Icon badge */}
      <div style={{
        flexShrink: 0, width: "44px", height: "44px", borderRadius: "50%",
        background: bg, border: `1.5px solid ${color}33`,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: "1.1rem",
      }}>
        {icon}
      </div>

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontFamily: "var(--font-body)", fontSize: "0.9rem",
          fontWeight: seen ? 300 : 500, color: "var(--text-dark)",
          lineHeight: 1.5, marginBottom: "0.4rem",
        }}>
          {notif.message}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>
          <span style={{
            fontFamily: "var(--font-body)", fontSize: "0.72rem", fontWeight: 500,
            letterSpacing: "0.06em", textTransform: "uppercase",
            color, padding: "0.15rem 0.6rem", background: bg, borderRadius: "20px",
          }}>
            {(notif.type || "notification").replace(/-/g, " ")}
          </span>
          {notif.createdAt && (
            <span style={{ fontFamily: "var(--font-body)", fontSize: "0.75rem", color: "var(--text-light)" }}>
              {timeAgo(notif.createdAt)}
            </span>
          )}
        </div>

        {/* Per-card action buttons */}
        <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.85rem" }}>
          {!seen && (
            <button
              onClick={() => onMarkRead(notif)}
              disabled={isActing}
              style={{
                padding: "0.35rem 0.9rem",
                background: "none",
                border: `1px solid ${color}55`,
                borderRadius: "var(--radius-sm)",
                fontFamily: "var(--font-body)",
                fontSize: "0.72rem",
                fontWeight: 500,
                letterSpacing: "0.05em",
                color,
                cursor: isActing ? "not-allowed" : "pointer",
                transition: "all 0.2s ease",
              }}
              onMouseEnter={e => { e.currentTarget.style.background = bg; }}
              onMouseLeave={e => { e.currentTarget.style.background = "none"; }}
            >
              ✓ Mark as Read
            </button>
          )}
          <button
            onClick={() => onDelete(notif)}
            disabled={isActing}
            style={{
              padding: "0.35rem 0.9rem",
              background: "none",
              border: "1px solid rgba(197,100,100,0.35)",
              borderRadius: "var(--radius-sm)",
              fontFamily: "var(--font-body)",
              fontSize: "0.72rem",
              fontWeight: 500,
              letterSpacing: "0.05em",
              color: "#c0392b",
              cursor: isActing ? "not-allowed" : "pointer",
              transition: "all 0.2s ease",
            }}
            onMouseEnter={e => { e.currentTarget.style.background = "#fdeaea"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "none"; }}
          >
            🗑 Delete
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Main component ───────────────────────────────────────────────── */
export default function Notification() {
  const navigate = useNavigate();

  // Always read fresh from localStorage so role is correct after any navigation
  const userData = JSON.parse(localStorage.getItem("userData") || "{}");
  const isAdmin  = userData.type === "admin";
  const isDoctor = !isAdmin && userData.isdoctor === true;
  const role     = isAdmin ? "admin" : isDoctor ? "doctor" : "user";
  const navItems = isAdmin ? ADMIN_NAV : isDoctor ? DOCTOR_NAV : USER_NAV;

  const [unread,   setUnread]   = useState([]);
  const [seen,     setSeen]     = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [marking,  setMarking]  = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [acting,   setActing]   = useState(null); // key of card being acted on
  const [tab,      setTab]      = useState("unread");

  const fetchNotifications = async () => {
    try {
      const { data } = await axiosInstance.post(
        "/api/user/getuserdata", {}, { headers: authHeader() }
      );
      setUnread(data.data.notification     || []);
      setSeen(data.data.seennotification   || []);
    } catch {
      message.error("Failed to load notifications.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchNotifications(); }, []);

  /* ── Bulk actions ── */
  const markAllRead = async () => {
    if (unread.length === 0) return;
    try {
      setMarking(true);
      await axiosInstance.post("/api/user/getallnotification", {}, { headers: authHeader() });
      message.success("All notifications marked as read");
      setSeen((prev) => [...unread, ...prev]);
      setUnread([]);
      setTab("seen");
    } catch { message.error("Failed to mark notifications as read."); }
    finally  { setMarking(false); }
  };

  const deleteAll = async () => {
    try {
      setDeleting(true);
      await axiosInstance.post("/api/user/deleteallnotification", {}, { headers: authHeader() });
      message.success("All notifications cleared");
      setUnread([]);
      setSeen([]);
      setTab("unread");
    } catch { message.error("Failed to delete notifications."); }
    finally  { setDeleting(false); }
  };

  /* ── Per-card actions ──
     The backend only has bulk endpoints so we simulate per-card by
     moving/removing locally and syncing via the bulk endpoints.      */
  const markOneRead = async (notif) => {
    const key = notif._id || notif.message;
    try {
      setActing(key);
      const updatedUnread = unread.filter((n) => (n._id || n.message) !== key);
      setUnread(updatedUnread);
      setSeen((prev) => [notif, ...prev]);
      message.success("Notification marked as read");

      // When the last unread is marked, sync to backend
      // (bulk mark-all is the only server endpoint available)
      if (updatedUnread.length === 0) {
        await axiosInstance.post("/api/user/getallnotification", {}, { headers: authHeader() });
      }
      // When there are still unread items, local state is correct —
      // server still holds them as unread which is fine until the user
      // marks them all or navigates away and reloads.
    } catch { message.error("Failed to update notification."); }
    finally  { setActing(null); }
  };

  const deleteOne = async (notif) => {
    const key = notif._id || notif.message;
    try {
      setActing(key);

      // Update local state only — never refetch (refetch restores server state)
      const newUnread = unread.filter((n) => (n._id || n.message) !== key);
      const newSeen   = seen.filter((n)   => (n._id || n.message) !== key);
      setUnread(newUnread);
      setSeen(newSeen);
      message.success("Notification deleted");

      // If everything is now gone, sync the server via bulk delete
      if (newUnread.length === 0 && newSeen.length === 0) {
        await axiosInstance.post("/api/user/deleteallnotification", {}, { headers: authHeader() });
      }
    } catch { message.error("Failed to delete notification."); }
    finally  { setActing(null); }
  };

  const activeList  = tab === "unread" ? unread : seen;
  const totalCount  = unread.length + seen.length;

  return (
    <div className="dashboard-layout">
      <Sidebar
        role={role}
        navItems={navItems}
        userName={userData.fullName || ""}
        notifCount={unread.length}
      />

      <main className="dashboard-main">
        <header className="dashboard-header">
          <h3>Notifications</h3>
          <div style={{ display: "flex", gap: "0.75rem" }}>
            {unread.length > 0 && (
              <button
                onClick={markAllRead}
                disabled={marking}
                className="btn-brand-outline"
                style={{ padding: "0.5rem 1.2rem", fontSize: "0.78rem" }}
              >
                {marking ? "Marking…" : "✓ Mark all read"}
              </button>
            )}
            {totalCount > 0 && (
              <button
                onClick={deleteAll}
                disabled={deleting}
                style={{
                  padding: "0.5rem 1.2rem", fontSize: "0.78rem",
                  background: "none", border: "1.5px solid rgba(197,100,100,0.4)",
                  borderRadius: "var(--radius-sm)", color: "#c0392b",
                  fontFamily: "var(--font-body)", fontWeight: 500,
                  letterSpacing: "0.06em", textTransform: "uppercase",
                  cursor: deleting ? "not-allowed" : "pointer",
                  opacity: deleting ? 0.7 : 1, transition: "all 0.25s ease",
                }}
              >
                {deleting ? "Clearing…" : "🗑 Clear all"}
              </button>
            )}
          </div>
        </header>

        <div className="dashboard-content">
          {loading ? (
            <LoadingState />
          ) : totalCount === 0 ? (
            <EmptyState />
          ) : (
            <div style={{ maxWidth: "720px" }}>
              {/* Tab bar */}
              <div style={{
                display: "flex", gap: "0", marginBottom: "1.75rem",
                background: "var(--surface-mid)", borderRadius: "var(--radius-sm)",
                padding: "0.25rem", width: "fit-content",
              }}>
                {[
                  { key: "unread", label: "Unread", count: unread.length },
                  { key: "seen",   label: "Read",   count: seen.length   },
                ].map((t) => (
                  <button
                    key={t.key}
                    onClick={() => setTab(t.key)}
                    style={{
                      padding: "0.5rem 1.25rem", borderRadius: "var(--radius-sm)",
                      border: "none", background: tab === t.key ? "#fff" : "transparent",
                      boxShadow: tab === t.key ? "var(--shadow-sm)" : "none",
                      fontFamily: "var(--font-body)", fontSize: "0.82rem",
                      fontWeight: tab === t.key ? 500 : 400,
                      color: tab === t.key ? "var(--text-dark)" : "var(--text-light)",
                      cursor: "pointer", transition: "all 0.2s ease",
                      display: "flex", alignItems: "center", gap: "0.5rem",
                    }}
                  >
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

              {/* List */}
              {activeList.length === 0 ? (
                <div style={{
                  textAlign: "center", padding: "4rem 2rem",
                  color: "var(--text-light)", fontFamily: "var(--font-body)", fontSize: "0.9rem",
                }}>
                  {tab === "unread"
                    ? "You're all caught up — no unread notifications."
                    : "No read notifications yet."}
                </div>
              ) : (
                activeList.map((notif, i) => (
                  <NotifCard
                    key={notif._id || notif.message || i}
                    notif={notif}
                    seen={tab === "seen"}
                    index={i}
                    onMarkRead={markOneRead}
                    onDelete={deleteOne}
                    isActing={acting === (notif._id || notif.message)}
                  />
                ))
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

function LoadingState() {
  return (
    <div style={{ maxWidth: "720px" }}>
      {[1,2,3].map((i) => (
        <div key={i} style={{
          height: "120px", borderRadius: "var(--radius-md)", marginBottom: "0.75rem",
          background: "linear-gradient(90deg, var(--surface-mid) 25%, var(--surface) 50%, var(--surface-mid) 75%)",
          backgroundSize: "200% 100%", animation: "shimmer 1.4s ease-in-out infinite",
        }} />
      ))}
      <style>{`@keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }`}</style>
    </div>
  );
}

function EmptyState() {
  const navigate = useNavigate();
  return (
    <div style={{ textAlign: "center", padding: "6rem 2rem" }}>
      <div style={{ fontSize: "3.5rem", marginBottom: "1rem" }}>🔔</div>
      <h3 style={{ fontFamily: "var(--font-display)", fontWeight: 400, fontSize: "1.6rem", color: "var(--text-dark)", marginBottom: "0.5rem" }}>
        No notifications yet
      </h3>
      <p style={{ fontFamily: "var(--font-body)", color: "var(--text-light)", fontWeight: 300, marginBottom: "2rem", maxWidth: "360px", margin: "0 auto 2rem", lineHeight: 1.7 }}>
        You'll receive notifications here when appointments are updated or doctor applications are reviewed.
      </p>
      <button className="btn-brand" onClick={() => navigate(-1)}>← Go back</button>
    </div>
  );
}
