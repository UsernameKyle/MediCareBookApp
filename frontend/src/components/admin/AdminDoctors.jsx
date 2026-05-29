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
  pending:  { color: "#92632a", bg: "#fdf3e3", label: "Pending"  },
  approved: { color: "#2d6a4f", bg: "#e8f5ee", label: "Approved" },
  rejected: { color: "#7b2d2d", bg: "#fdeaea", label: "Rejected" },
};

export default function AdminDoctors() {
  const userData = JSON.parse(localStorage.getItem("userData") || "{}");
  const [doctors,  setDoctors]  = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search,   setSearch]   = useState("");
  const [tab,      setTab]      = useState("all");
  const [loading,  setLoading]  = useState(true);
  const [actingOn, setActingOn] = useState(null); // doctorId being approved/rejected

  const fetchDoctors = async () => {
    try {
      const { data } = await axiosInstance.get("/api/admin/getalldoctors", { headers: authHeader() });
      setDoctors(data.data);
    } catch { message.error("Failed to load doctors."); }
    finally  { setLoading(false); }
  };

  useEffect(() => { fetchDoctors(); }, []);

  useEffect(() => {
    const q   = search.toLowerCase();
    const src = tab === "all" ? doctors : doctors.filter((d) => d.status === tab);
    setFiltered(src.filter((d) =>
      d.fullName.toLowerCase().includes(q) ||
      d.specialisation.toLowerCase().includes(q) ||
      d.email.toLowerCase().includes(q)
    ));
  }, [search, tab, doctors]);

  const handleAction = async (doctor, action) => {
    const endpoint = action === "approve" ? "/api/admin/getapprove" : "/api/admin/getreject";
    try {
      setActingOn(doctor._id);
      await axiosInstance.post(endpoint, {
        doctorId: doctor._id,
        userid:   doctor.userId,
      }, { headers: authHeader() });

      message.success(`Doctor ${action === "approve" ? "approved" : "rejected"} successfully`);
      fetchDoctors();
    } catch (err) {
      message.error(err.response?.data?.message || `Failed to ${action} doctor.`);
    } finally {
      setActingOn(null);
    }
  };

  const tabs = [
    { key: "all",      label: "All",      count: doctors.length },
    { key: "pending",  label: "Pending",  count: doctors.filter((d) => d.status === "pending").length  },
    { key: "approved", label: "Approved", count: doctors.filter((d) => d.status === "approved").length },
    { key: "rejected", label: "Rejected", count: doctors.filter((d) => d.status === "rejected").length },
  ];

  return (
    <div className="dashboard-layout">
      <Sidebar role="admin" navItems={NAV_ITEMS} userName={userData.fullName || ""} notifCount={0} />

      <main className="dashboard-main">
        <header className="dashboard-header">
          <h3>Doctor Applications</h3>
          <input
            placeholder="Search by name, specialty, email…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: "260px", padding: "0.6rem 1rem",
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

          {loading ? (
            <DoctorCardSkeleton />
          ) : filtered.length === 0 ? (
            <EmptyState tab={tab} />
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: "1.5rem" }}>
              {filtered.map((doc, i) => (
                <DoctorCard
                  key={doc._id}
                  doc={doc}
                  index={i}
                  acting={actingOn === doc._id}
                  onApprove={() => handleAction(doc, "approve")}
                  onReject={()  => handleAction(doc, "reject")}
                />
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

function DoctorCard({ doc, index, acting, onApprove, onReject }) {
  const ss = STATUS_STYLE[doc.status] || STATUS_STYLE.pending;
  const colors = ["#748469","#ABB290","#92632a","#2d6a4f","#3d4a38"];
  const color  = colors[index % colors.length];
  const initials = doc.fullName.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase();

  return (
    <div className={`card-brand animate-fade-up delay-${(index % 4) + 1}`} style={{ padding: 0, overflow: "hidden" }}>
      <div style={{ height: "5px", background: color }} />
      <div style={{ padding: "1.75rem" }}>

        {/* Header row */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.25rem" }}>
          <div style={{ display: "flex", gap: "0.85rem", alignItems: "center" }}>
            <div style={{
              width: "46px", height: "46px", borderRadius: "50%", background: color,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontFamily: "var(--font-display)", fontSize: "1rem", color: "#fff", flexShrink: 0,
            }}>
              {initials}
            </div>
            <div>
              <div style={{ fontFamily: "var(--font-display)", fontSize: "1.05rem", fontWeight: 400, color: "var(--text-dark)", lineHeight: 1.2 }}>
                {doc.fullName}
              </div>
              <div style={{ fontFamily: "var(--font-body)", fontSize: "0.75rem", fontWeight: 500, letterSpacing: "0.06em", textTransform: "uppercase", color, marginTop: "0.15rem" }}>
                {doc.specialisation}
              </div>
            </div>
          </div>
          <span style={{
            padding: "0.25rem 0.75rem", borderRadius: "20px",
            fontSize: "0.68rem", fontWeight: 500, letterSpacing: "0.06em",
            textTransform: "uppercase", fontFamily: "var(--font-body)",
            color: ss.color, background: ss.bg, flexShrink: 0,
          }}>
            {ss.label}
          </span>
        </div>

        {/* Details */}
        <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem", marginBottom: "1.5rem" }}>
          {[
            { icon: "✉️", text: doc.email },
            { icon: "📍", text: doc.address },
            { icon: "💼", text: `${doc.experience} experience` },
            { icon: "💰", text: `₱${doc.fees} per consultation` },
            { icon: "🕐", text: `${doc.timings?.[0]} – ${doc.timings?.[1]}` },
          ].map((r) => (
            <div key={r.text} style={{ display: "flex", gap: "0.6rem", alignItems: "center", fontFamily: "var(--font-body)", fontSize: "0.82rem", color: "var(--text-mid)" }}>
              <span style={{ fontSize: "0.8rem", flexShrink: 0 }}>{r.icon}</span>
              <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.text}</span>
            </div>
          ))}
        </div>

        {/* Action buttons — only show for pending */}
        {doc.status === "pending" && (
          <div style={{ display: "flex", gap: "0.75rem", paddingTop: "1.25rem", borderTop: "1px solid rgba(171,178,144,0.15)" }}>
            <button
              onClick={onApprove}
              disabled={acting}
              style={{
                flex: 1, padding: "0.7rem", background: "#2d6a4f", color: "#fff",
                border: "none", borderRadius: "var(--radius-sm)", fontFamily: "var(--font-body)",
                fontSize: "0.8rem", fontWeight: 500, letterSpacing: "0.06em",
                textTransform: "uppercase", cursor: acting ? "not-allowed" : "pointer",
                opacity: acting ? 0.7 : 1, transition: "all 0.25s ease",
              }}
            >
              {acting ? "…" : "✓ Approve"}
            </button>
            <button
              onClick={onReject}
              disabled={acting}
              style={{
                flex: 1, padding: "0.7rem", background: "none", color: "#7b2d2d",
                border: "1.5px solid rgba(197,100,100,0.4)", borderRadius: "var(--radius-sm)",
                fontFamily: "var(--font-body)", fontSize: "0.8rem", fontWeight: 500,
                letterSpacing: "0.06em", textTransform: "uppercase",
                cursor: acting ? "not-allowed" : "pointer",
                opacity: acting ? 0.7 : 1, transition: "all 0.25s ease",
              }}
            >
              {acting ? "…" : "✕ Reject"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function DoctorCardSkeleton() {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: "1.5rem" }}>
      {[1,2,3].map((i) => (
        <div key={i} className="card-brand" style={{
          height: "320px",
          background: "linear-gradient(90deg, var(--surface-mid) 25%, var(--surface) 50%, var(--surface-mid) 75%)",
          backgroundSize: "200% 100%", animation: "shimmer 1.4s ease-in-out infinite",
        }} />
      ))}
      <style>{`@keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }`}</style>
    </div>
  );
}

function EmptyState({ tab }) {
  return (
    <div style={{ textAlign: "center", padding: "5rem 2rem" }}>
      <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>🩺</div>
      <h3 style={{ fontFamily: "var(--font-display)", fontWeight: 400, fontSize: "1.5rem", color: "var(--text-dark)", marginBottom: "0.5rem" }}>
        No {tab === "all" ? "" : tab} applications
      </h3>
      <p style={{ fontFamily: "var(--font-body)", color: "var(--text-light)", fontWeight: 300 }}>
        {tab === "pending" ? "No applications waiting for review." : "Nothing to show here yet."}
      </p>
    </div>
  );
}
