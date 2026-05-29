import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { message, Modal } from "antd";
import Sidebar from "../common/Sidebar.jsx";
import { DOCTOR_NAV } from "./DoctorHome.jsx";
import axiosInstance, { authHeader } from "../../axiosConfig.js";

const STATUS_COLORS = {
  pending:  { color: "#92632a", bg: "#fdf3e3" },
  approved: { color: "#2d6a4f", bg: "#e8f5ee" },
  rejected: { color: "#7b2d2d", bg: "#fdeaea" },
};

export default function DoctorAppointments() {
  const navigate = useNavigate();
  const userData = JSON.parse(localStorage.getItem("userData") || "{}");
  const [appointments, setAppointments] = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [actingOn,     setActingOn]     = useState(null);

  const fetchAppointments = async () => {
    try {
      const { data } = await axiosInstance.get(
        "/api/doctor/getdoctorappointments", { headers: authHeader() }
      );
      setAppointments(data.data);
    } catch { message.error("Failed to load appointments."); }
    finally  { setLoading(false); }
  };

  useEffect(() => { fetchAppointments(); }, []);

  const handleStatus = async (appointmentId, status) => {
    try {
      setActingOn(appointmentId);
      await axiosInstance.post(
        "/api/doctor/handlestatus",
        { appointmentId, status },
        { headers: authHeader() }
      );
      message.success(`Appointment ${status}`);
      fetchAppointments();
    } catch (err) {
      message.error(err.response?.data?.message || "Failed to update status.");
    } finally {
      setActingOn(null);
    }
  };

  const confirmDelete = (apptId) => {
    Modal.confirm({
      title: "Delete appointment",
      content: "Are you sure you want to delete this appointment?",
      okText: "Delete",
      okType: "danger",
      cancelText: "Cancel",
      onOk: async () => {
        try {
          await axiosInstance.post("/api/user/deleteappointment", { appointmentId: apptId }, { headers: authHeader() });
          setAppointments((prev) => prev.filter((a) => a._id !== apptId));
          message.success("Appointment deleted");
        } catch (err) {
          message.error(err.response?.data?.message || "Failed to delete appointment.");
        }
      },
    });
  };

  const downloadAppointmentDocument = async (appointId, fileName) => {
    try {
      const resp = await axiosInstance.get(
        `/api/doctor/getdocumentdownload?appointId=${encodeURIComponent(appointId)}`,
        { headers: authHeader(), responseType: "blob" }
      );

      const url = window.URL.createObjectURL(new Blob([resp.data]));
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName || "document";
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      message.error(err.response?.data?.message || "Failed to download document.");
    }
  };

  return (
    <div className="dashboard-layout">
      <Sidebar role="doctor" navItems={DOCTOR_NAV} userName={userData.fullName || ""} notifCount={0} />

      <main className="dashboard-main">
        <header className="dashboard-header">
          <h3>My Appointments</h3>
        </header>

        <div className="dashboard-content">
          {loading ? (
            <Shimmer rows={4} />
          ) : appointments.length === 0 ? (
            <EmptyState />
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem", maxWidth: "760px" }}>
              {appointments.map((appt, i) => {
                const sc     = STATUS_COLORS[appt.status] || STATUS_COLORS.pending;
                const acting = actingOn === appt._id;
                return (
                  <div
                    key={appt._id}
                    className={`card-brand animate-fade-up delay-${(i % 4) + 1}`}
                    style={{ padding: "1.5rem 2rem" }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: appt.status === "pending" ? "1.25rem" : "0" }}>
                      <div>
                        <div style={{ fontFamily: "var(--font-display)", fontSize: "1.1rem", color: "var(--text-dark)", marginBottom: "0.3rem" }}>
                          📅 {appt.date}
                        </div>
                        <div style={{ fontFamily: "var(--font-body)", fontSize: "0.8rem", color: "var(--text-light)" }}>
                          Booked {new Date(appt.createdAt).toLocaleDateString()}
                          {appt.document?.path && (
                            <span style={{ marginLeft: "0.75rem", color: "var(--secondary)" }}>
                              📎 Document attached
                            </span>
                          )}
                        </div>
                      </div>
                      <span style={{
                        padding: "0.35rem 1rem", borderRadius: "20px",
                        fontSize: "0.72rem", fontWeight: 500, letterSpacing: "0.08em",
                        textTransform: "uppercase", fontFamily: "var(--font-body)",
                        color: sc.color, background: sc.bg,
                      }}>
                        {appt.status}
                      </span>
                    </div>

                    {/* Approve / Reject — only for pending */}
                    {appt.status === "pending" && (
                      <div style={{ display: "flex", gap: "0.75rem", paddingTop: "1.25rem", borderTop: "1px solid rgba(171,178,144,0.15)" }}>
                        <button
                          onClick={() => handleStatus(appt._id, "approved")}
                          disabled={acting}
                          style={{
                            padding: "0.6rem 1.5rem", background: "#2d6a4f", color: "#fff",
                            border: "none", borderRadius: "var(--radius-sm)",
                            fontFamily: "var(--font-body)", fontSize: "0.8rem", fontWeight: 500,
                            letterSpacing: "0.06em", textTransform: "uppercase",
                            cursor: acting ? "not-allowed" : "pointer",
                            opacity: acting ? 0.7 : 1, transition: "all 0.25s ease",
                          }}
                        >
                          {acting ? "…" : "✓ Approve"}
                        </button>
                        <button
                          onClick={() => handleStatus(appt._id, "rejected")}
                          disabled={acting}
                          style={{
                            padding: "0.6rem 1.5rem", background: "none",
                            border: "1.5px solid rgba(197,100,100,0.4)", color: "#7b2d2d",
                            borderRadius: "var(--radius-sm)", fontFamily: "var(--font-body)",
                            fontSize: "0.8rem", fontWeight: 500, letterSpacing: "0.06em",
                            textTransform: "uppercase", cursor: acting ? "not-allowed" : "pointer",
                            opacity: acting ? 0.7 : 1, transition: "all 0.25s ease",
                          }}
                        >
                          {acting ? "…" : "✕ Reject"}
                        </button>
                      </div>
                    )}

                    {/* Always-available actions: view & delete */}
                    <div style={{ display: "flex", gap: "0.75rem", paddingTop: "1rem", borderTop: "1px solid rgba(171,178,144,0.08)", marginTop: "0.75rem" }}>
                      {appt.document?.path && (
                        <button
                          onClick={() => downloadAppointmentDocument(appt._id, appt.document?.name)}
                          style={{
                            padding: "0.6rem 1.5rem", background: "none",
                            border: "1.5px solid rgba(116,132,105,0.4)", color: "var(--secondary)",
                            borderRadius: "var(--radius-sm)", fontFamily: "var(--font-body)",
                            fontSize: "0.8rem", fontWeight: 500, letterSpacing: "0.06em",
                            textTransform: "uppercase", cursor: "pointer", transition: "all 0.25s ease",
                          }}
                        >
                          📎 View Document
                        </button>
                      )}
                      <button
                        onClick={() => confirmDelete(appt._id)}
                        style={{
                          padding: "0.6rem 1.5rem", background: "none",
                          border: "1.5px solid rgba(197,100,100,0.4)", color: "#c0392b",
                          borderRadius: "var(--radius-sm)", fontFamily: "var(--font-body)",
                          fontSize: "0.8rem", fontWeight: 500, letterSpacing: "0.06em",
                          textTransform: "uppercase", cursor: "pointer", transition: "all 0.25s ease",
                        }}
                      >
                        🗑 Delete
                      </button>
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
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem", maxWidth: "760px" }}>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="card-brand" style={{
          height: "90px",
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
        Appointments will appear here when patients book with you.
      </p>
    </div>
  );
}
