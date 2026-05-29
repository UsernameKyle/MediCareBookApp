import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { DatePicker, message, Modal } from "antd";
import Sidebar from "../common/Sidebar.jsx";
import { useUserNav } from "../common/useUserNav.js";
import { DOCTOR_NAV } from "../doctor/DoctorHome.jsx";
import axiosInstance, { authHeader } from "../../axiosConfig.js";

const STATUS_COLORS = {
  pending:  { color: "#92632a", bg: "#fdf3e3" },
  approved: { color: "#2d6a4f", bg: "#e8f5ee" },
  rejected: { color: "#7b2d2d", bg: "#fdeaea" },
};

export default function UserAppointment() {
  const location = useLocation();
  const navigate = useNavigate();
  const { role, navItems, userData } = useUserNav();
  const isDoctor = userData?.isdoctor === true;
  const sidebarNav = isDoctor ? DOCTOR_NAV : navItems;
  const sidebarRole = isDoctor ? "doctor" : role;

  const [appointments, setAppointments] = useState([]);
  const [loadingList, setLoadingList]   = useState(true);
  const [booking,     setBooking]       = useState(false);
  const [file,        setFile]          = useState(null);
  const [date,        setDate]          = useState(null);
  const [dateError,   setDateError]     = useState("");
  const [selectedDoctor, setSelectedDoctor] = useState(location.state?.doctor || null);
  const [view, setView] = useState(location.state?.doctor ? "book" : "list");

  const fetchAppointments = async () => {
    try {
      const { data } = await axiosInstance.get(
        "/api/user/getuserappointments",
        { headers: authHeader() }
      );
      setAppointments(data.data);
    } catch {
      message.error("Failed to load appointments.");
    } finally {
      setLoadingList(false);
    }
  };

  useEffect(() => { fetchAppointments(); }, []);

  const onBook = async () => {
    if (!selectedDoctor) {
      message.error("Please select a doctor first. Browse the doctor list to book.");
      return;
    }
    if (!date) {
      setDateError("Please select a date and time");
      return;
    }
    setDateError("");

    try {
      setBooking(true);
      const fd = new FormData();
      fd.append("userInfo",   JSON.stringify(userData._id));
      fd.append("doctorInfo", JSON.stringify(selectedDoctor._id));
      fd.append("date",       date.format("YYYY-MM-DD HH:mm"));
      if (file) fd.append("document", file);

      await axiosInstance.post("/api/user/getappointment", fd, {
        headers: authHeader(),
      });

      message.success("Appointment booked successfully!");
      setDate(null);
      setFile(null);
      setSelectedDoctor(null);
      setView("list");
      fetchAppointments();
    } catch (err) {
      message.error(err.response?.data?.message || "Booking failed. Please try again.");
    } finally {
      setBooking(false);
    }
  };

  return (
    <div className="dashboard-layout">
      <Sidebar
        role={sidebarRole}
        navItems={sidebarNav}
        userName={userData.fullName || ""}
        notifCount={0}
      />

      <main className="dashboard-main">
        <header className="dashboard-header">
          <h3>My Appointments</h3>
          <div style={{ display: "flex", gap: "0.75rem" }}>
            <button
              className={view === "list" ? "btn-brand" : "btn-brand-outline"}
              style={{ padding: "0.5rem 1.2rem", fontSize: "0.8rem" }}
              onClick={() => setView("list")}
            >
              📋 My Appointments
            </button>
            <button
              className={view === "book" ? "btn-brand" : "btn-brand-outline"}
              style={{ padding: "0.5rem 1.2rem", fontSize: "0.8rem" }}
              onClick={() => setView("book")}
            >
              + Book New
            </button>
          </div>
        </header>

        <div className="dashboard-content">
          {view === "list" ? (
            <AppointmentList
              appointments={appointments}
              setAppointments={setAppointments}
              loading={loadingList}
            />
          ) : (
            <BookingForm
              selectedDoctor={selectedDoctor}
              setSelectedDoctor={setSelectedDoctor}
              userData={userData}
              date={date}
              setDate={(val) => { setDate(val); setDateError(""); }}
              dateError={dateError}
              file={file}
              setFile={setFile}
              booking={booking}
              onBook={onBook}
              onCancel={() => setView("list")}
              onBrowseDoctors={() => navigate("/doctors")}
            />
          )}
        </div>
      </main>
    </div>
  );
}

/* ── Appointment list ─────────────────────────────────────────────── */
function AppointmentList({ appointments, loading, setAppointments }) {
  const navigate = useNavigate();

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

  if (loading) return (
    <div style={{ textAlign: "center", padding: "4rem", color: "var(--text-light)", fontFamily: "var(--font-body)" }}>
      Loading appointments…
    </div>
  );

  if (appointments.length === 0) return (
    <div style={{ textAlign: "center", padding: "5rem 2rem" }}>
      <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>📅</div>
      <h3 style={{
        fontFamily: "var(--font-display)", fontWeight: 400,
        fontSize: "1.5rem", color: "var(--text-dark)", marginBottom: "0.5rem",
      }}>
        No appointments yet
      </h3>
      <p style={{ fontFamily: "var(--font-body)", color: "var(--text-light)", fontWeight: 300, marginBottom: "1.5rem" }}>
        Browse our doctor list to book your first appointment.
      </p>
      <button className="btn-brand" onClick={() => navigate("/doctors")}>
        🔍 Find a Doctor
      </button>
    </div>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem", maxWidth: "720px" }}>
      {appointments.map((appt, i) => {
        const sc = STATUS_COLORS[appt.status] || STATUS_COLORS.pending;
        return (
          <div
            key={appt._id}
            className={`card-brand animate-fade-up delay-${(i % 4) + 1}`}
            style={{ padding: "1.5rem 2rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}
          >
            <div>
              <div style={{ fontFamily: "var(--font-display)", fontSize: "1.1rem", color: "var(--text-dark)", marginBottom: "0.3rem" }}>
                📅 {appt.date}
              </div>
              <div style={{ fontFamily: "var(--font-body)", fontSize: "0.8rem", color: "var(--text-light)" }}>
                Booked {new Date(appt.createdAt).toLocaleDateString()}
              </div>
            </div>
            <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
              <span style={{
              padding: "0.35rem 1rem", borderRadius: "20px",
              fontSize: "0.72rem", fontWeight: 500, letterSpacing: "0.08em",
              textTransform: "uppercase", fontFamily: "var(--font-body)",
              color: sc.color, background: sc.bg,
            }}>
              {appt.status}
              </span>
              <button
                onClick={() => confirmDelete(appt._id)}
                style={{
                  background: "none", border: "1px solid rgba(197,100,100,0.35)", padding: "0.45rem 0.9rem",
                  borderRadius: "var(--radius-sm)", color: "#c0392b", cursor: "pointer",
                }}
              >
                🗑 Delete
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ── Booking form ─────────────────────────────────────────────────── */
function BookingForm({ selectedDoctor, setSelectedDoctor, userData, date, setDate, dateError, file, setFile, booking, onBook, onCancel, onBrowseDoctors }) {
  const labelStyle = {
    display: "block", fontFamily: "var(--font-body)", fontSize: "0.72rem",
    fontWeight: 500, letterSpacing: "0.1em", textTransform: "uppercase",
    color: "var(--text-mid)", marginBottom: "0.45rem",
  };

  return (
    <div style={{ maxWidth: "560px" }}>
      <div className="card-brand animate-fade-up" style={{ padding: "2.5rem" }}>
        <h4 style={{
          fontFamily: "var(--font-display)", fontWeight: 400,
          fontSize: "1.3rem", color: "var(--text-dark)", marginBottom: "1.75rem",
        }}>
          Book an Appointment
        </h4>

        {userData?.isdoctor && (
          <div style={{ marginBottom: "1rem", padding: "0.75rem 1rem", borderRadius: "var(--radius-sm)", background: "rgba(171,178,144,0.06)", color: "var(--text-light)", fontFamily: "var(--font-body)", fontSize: "0.9rem" }}>
            You are booking as <strong>Dr. {userData.fullName}</strong>. This appointment will be created under your account.
          </div>
        )}

        {/* Doctor selection state */}
        {selectedDoctor ? (
          <div style={{
            background: "var(--surface-mid)", borderRadius: "var(--radius-sm)",
            padding: "1rem 1.25rem", marginBottom: "1.5rem",
            display: "flex", justifyContent: "space-between", alignItems: "center",
            border: "1.5px solid rgba(116,132,105,0.25)",
          }}>
            <div>
              <div style={{ fontFamily: "var(--font-display)", fontSize: "1rem", color: "var(--text-dark)" }}>
                {selectedDoctor.fullName}
              </div>
              <div style={{ fontFamily: "var(--font-body)", fontSize: "0.78rem", color: "var(--text-light)" }}>
                {selectedDoctor.specialisation} · ₱{selectedDoctor.fees}
              </div>
            </div>
            <button
              onClick={() => setSelectedDoctor(null)}
              style={{
                background: "none", border: "none", color: "var(--text-light)",
                cursor: "pointer", fontSize: "0.75rem", fontFamily: "var(--font-body)",
              }}
            >
              ✕ Change
            </button>
          </div>
        ) : (
          <div style={{
            padding: "1.25rem",
            marginBottom: "1.5rem",
            background: "rgba(249,234,215,0.5)",
            border: "1.5px dashed rgba(171,178,144,0.5)",
            borderRadius: "var(--radius-sm)",
          }}>
            <p style={{
              fontFamily: "var(--font-body)", fontSize: "0.875rem",
              color: "var(--text-mid)", margin: "0 0 0.75rem 0", lineHeight: 1.6,
            }}>
              No doctor selected. Browse available specialists and click
              <strong> "Book Appointment"</strong> on a doctor's card to pre-select them.
            </p>
            <button
              onClick={onBrowseDoctors}
              className="btn-brand"
              style={{ padding: "0.6rem 1.2rem", fontSize: "0.78rem" }}
            >
              🔍 Browse Doctors
            </button>
          </div>
        )}

        {/* Date picker */}
        <div style={{ marginBottom: "1.25rem" }}>
          <label style={labelStyle}>Preferred date & time</label>
          <DatePicker
            showTime={{ format: "HH:mm" }}
            format="YYYY-MM-DD HH:mm"
            value={date}
            onChange={setDate}
            disabledDate={(d) => d && d.isBefore(new Date(), "day")}
            style={{
              width: "100%",
              borderColor: dateError ? "#c0392b" : "rgba(171,178,144,0.35)",
              borderRadius: "var(--radius-sm)",
            }}
            placeholder="Select date and time"
          />
          {dateError && (
            <div style={{ fontFamily: "var(--font-body)", fontSize: "0.75rem", color: "#c0392b", marginTop: "0.3rem" }}>
              {dateError}
            </div>
          )}
        </div>

        {/* File upload */}
        <div style={{ marginBottom: "1.75rem" }}>
          <label style={labelStyle}>Attach document (optional)</label>
          <label style={{
            display: "flex", alignItems: "center", gap: "0.75rem",
            padding: "0.85rem 1rem",
            border: "1.5px dashed rgba(171,178,144,0.5)",
            borderRadius: "var(--radius-sm)", cursor: "pointer",
            fontFamily: "var(--font-body)", fontSize: "0.85rem",
            color: "var(--text-light)", transition: "border-color 0.25s ease",
          }}>
            <span>📎</span>
            {file ? file.name : "Click to upload medical records, referrals…"}
            <input
              type="file"
              style={{ display: "none" }}
              onChange={(e) => setFile(e.target.files[0])}
              accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
            />
          </label>
        </div>

        <div style={{ display: "flex", gap: "1rem" }}>
          <button
            onClick={onBook}
            className="btn-brand"
            disabled={booking}
            style={{ opacity: booking ? 0.7 : 1, cursor: booking ? "not-allowed" : "pointer" }}
          >
            {booking ? "Booking…" : "Confirm Booking"}
          </button>
          <button onClick={onCancel} className="btn-brand-outline">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
