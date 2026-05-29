import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { message } from "antd";
import Sidebar from "../common/Sidebar.jsx";
import { useUserNav } from "../common/useUserNav.js";
import { DOCTOR_NAV } from "../doctor/DoctorHome.jsx";
import axiosInstance, { authHeader } from "../../axiosConfig.js";

export default function DoctorList() {
  const navigate = useNavigate();
  const { role, navItems, userData } = useUserNav();
  const isDoctor = userData?.isdoctor === true;
  const sidebarNav = isDoctor ? DOCTOR_NAV : navItems;
  const sidebarRole = isDoctor ? "doctor" : role;
  const [doctors,  setDoctors] = useState([]);
  const [filtered, setFiltered]   = useState([]);
  const [search,   setSearch]     = useState("");
  const [loading,  setLoading]    = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const { data } = await axiosInstance.get("/api/user/getalldoctorsu", { headers: authHeader() });
        setDoctors(data.data);
        setFiltered(data.data);
      } catch { message.error("Failed to load doctors."); }
      finally  { setLoading(false); }
    };
    fetch();
  }, []);

  useEffect(() => {
    const q = search.toLowerCase();
    setFiltered(doctors.filter((d) =>
      d.fullName.toLowerCase().includes(q) ||
      d.specialisation.toLowerCase().includes(q) ||
      d.address.toLowerCase().includes(q)
    ));
  }, [search, doctors]);

  return (
    <div className="dashboard-layout">
      <Sidebar role={sidebarRole} navItems={sidebarNav} userName={userData.fullName || ""} notifCount={0} />

      <main className="dashboard-main">
        <header className="dashboard-header">
          <h3>Find a Doctor</h3>
          <input
            placeholder="Search by name, specialty, location…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: "280px", padding: "0.6rem 1rem",
              border: "1.5px solid rgba(171,178,144,0.35)",
              borderRadius: "var(--radius-sm)", fontFamily: "var(--font-body)",
              fontSize: "0.85rem", color: "var(--text-dark)", background: "#fff", outline: "none",
            }}
          />
        </header>

        <div className="dashboard-content">
          {loading ? <LoadingGrid /> : filtered.length === 0 ? (
            <EmptyState search={search} />
          ) : (
            <>
              <p style={{ fontFamily: "var(--font-body)", fontSize: "0.8rem", color: "var(--text-light)", marginBottom: "1.5rem" }}>
                {filtered.length} specialist{filtered.length !== 1 ? "s" : ""} available
              </p>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "1.5rem" }}>
                {filtered.map((doc, i) => (
                  <DoctorCard
                    key={doc._id}
                    doc={doc}
                    index={i}
                    onBook={() => navigate("/appointments", { state: { doctor: doc } })}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}

function DoctorCard({ doc, index, onBook }) {
  const initials = doc.fullName.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase();
  const colors   = ["#748469","#ABB290","#92632a","#2d6a4f","#3d4a38"];
  const color    = colors[index % colors.length];

  return (
    <div className={`card-brand animate-fade-up delay-${(index % 4) + 1}`} style={{ padding: 0, overflow: "hidden" }}>
      <div style={{ height: "6px", background: color }} />
      <div style={{ padding: "1.75rem" }}>
        <div style={{ display: "flex", gap: "1rem", alignItems: "flex-start", marginBottom: "1.25rem" }}>
          <div style={{ width: "52px", height: "52px", borderRadius: "50%", background: color, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--font-display)", fontSize: "1.2rem", color: "#fff", flexShrink: 0 }}>
            {initials}
          </div>
          <div>
            <div style={{ fontFamily: "var(--font-display)", fontSize: "1.15rem", fontWeight: 400, color: "var(--text-dark)", lineHeight: 1.2 }}>{doc.fullName}</div>
            <div style={{ fontFamily: "var(--font-body)", fontSize: "0.78rem", fontWeight: 500, letterSpacing: "0.08em", textTransform: "uppercase", color, marginTop: "0.2rem" }}>{doc.specialisation}</div>
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", marginBottom: "1.5rem" }}>
          {[
            { icon: "📍", text: doc.address },
            { icon: "🕐", text: `${doc.timings?.[0]} – ${doc.timings?.[1]}` },
            { icon: "💼", text: `${doc.experience} experience` },
            { icon: "💰", text: `₱${doc.fees} per consultation` },
          ].map((item) => (
            <div key={item.text} style={{ display: "flex", gap: "0.6rem", alignItems: "center", fontFamily: "var(--font-body)", fontSize: "0.82rem", color: "var(--text-mid)" }}>
              <span style={{ fontSize: "0.85rem" }}>{item.icon}</span>
              {item.text}
            </div>
          ))}
        </div>
        <button onClick={onBook} className="btn-brand" style={{ width: "100%", justifyContent: "center" }}>
          Book Appointment
        </button>
      </div>
    </div>
  );
}

function LoadingGrid() {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "1.5rem" }}>
      {[1,2,3,4,5,6].map((i) => (
        <div key={i} className="card-brand" style={{ height: "280px", background: "linear-gradient(90deg, var(--surface-mid) 25%, var(--surface) 50%, var(--surface-mid) 75%)", backgroundSize: "200% 100%", animation: "shimmer 1.4s ease-in-out infinite" }} />
      ))}
      <style>{`@keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }`}</style>
    </div>
  );
}

function EmptyState({ search }) {
  return (
    <div style={{ textAlign: "center", padding: "5rem 2rem" }}>
      <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>🔍</div>
      <h3 style={{ fontFamily: "var(--font-display)", fontWeight: 400, fontSize: "1.5rem", color: "var(--text-dark)", marginBottom: "0.5rem" }}>
        {search ? "No doctors found" : "No approved doctors yet"}
      </h3>
      <p style={{ fontFamily: "var(--font-body)", color: "var(--text-light)", fontWeight: 300 }}>
        {search ? `No results for "${search}". Try a different search.` : "Check back soon — doctors are being verified."}
      </p>
    </div>
  );
}
