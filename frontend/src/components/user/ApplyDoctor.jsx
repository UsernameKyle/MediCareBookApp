import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { TimePicker, message } from "antd";
import Sidebar from "../common/Sidebar.jsx";
import { useUserNav } from "../common/useUserNav.js";
import { DOCTOR_NAV } from "../doctor/DoctorHome.jsx";
import axiosInstance, { authHeader } from "../../axiosConfig.js";

const SPECIALISATIONS = [
  "General Practice","Cardiology","Dermatology","Endocrinology",
  "Gastroenterology","Neurology","Obstetrics & Gynaecology",
  "Oncology","Ophthalmology","Orthopaedics","Paediatrics",
  "Psychiatry","Pulmonology","Radiology","Urology",
];

/* ── Field component defined OUTSIDE to prevent remount on re-render ── */
function Field({ name, label, placeholder, type = "text", value, onChange, focused, onFocus, onBlur, error, children }) {
  return (
    <div style={{ marginBottom: "1rem" }}>
      <label style={{
        display: "block", fontFamily: "var(--font-body)", fontSize: "0.72rem",
        fontWeight: 500, letterSpacing: "0.1em", textTransform: "uppercase",
        color: "var(--text-mid)", marginBottom: "0.45rem",
      }}>
        {label}
      </label>
      {children ? children : (
        <input
          type={type}
          value={value}
          placeholder={placeholder}
          onChange={(e) => onChange(name, e.target.value)}
          onFocus={() => onFocus(name)}
          onBlur={() => onBlur(null)}
          style={{
            width: "100%", padding: "0.8rem 1rem", boxSizing: "border-box",
            border: `1.5px solid ${focused ? "var(--secondary)" : error ? "#c0392b" : "rgba(171,178,144,0.35)"}`,
            borderRadius: "var(--radius-sm)", fontFamily: "var(--font-body)",
            fontSize: "0.9rem", fontWeight: 300, color: "var(--text-dark)",
            background: "#fff", outline: "none",
            boxShadow: focused ? "0 0 0 3px rgba(116,132,105,0.12)" : "none",
            transition: "border-color 0.2s, box-shadow 0.2s",
          }}
        />
      )}
      {error && (
        <div style={{
          fontFamily: "var(--font-body)", fontSize: "0.75rem",
          color: "#c0392b", marginTop: "0.3rem",
        }}>
          {error}
        </div>
      )}
    </div>
  );
}

export default function ApplyDoctor() {
  const navigate  = useNavigate();
  const { role, navItems, userData } = useUserNav();
  const isDoctor = userData?.isdoctor === true;
  const sidebarNav = isDoctor ? DOCTOR_NAV : navItems;
  const sidebarRole = isDoctor ? "doctor" : role;
  const [loading, setLoading] = useState(false);
  const [focused, setFocused] = useState(null);
  const [timings, setTimings] = useState(null);

  const [fields, setFields] = useState({
    fullName: "", phone: "", email: "", address: "",
    specialisation: "", experience: "", fees: "",
  });
  const [errors, setErrors] = useState({});

  const setField = (name, value) => {
    setFields((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const validate = () => {
    const e = {};
    if (!fields.fullName.trim())      e.fullName      = "Full name is required";
    if (!fields.phone.trim())         e.phone         = "Phone is required";
    if (!fields.email.trim())         e.email         = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(fields.email)) e.email = "Enter a valid email";
    if (!fields.address.trim())       e.address       = "Address is required";
    if (!fields.specialisation)       e.specialisation= "Specialisation is required";
    if (!fields.experience.trim())    e.experience    = "Experience is required";
    if (!fields.fees)                 e.fees          = "Consultation fee is required";
    if (!timings)                     e.timings       = "Consultation hours are required";
    return e;
  };

  const onSubmit = async () => {
    const e = validate();
    if (Object.keys(e).length > 0) { setErrors(e); return; }
    try {
      setLoading(true);
      const payload = {
        ...fields,
        fees: Number(fields.fees),
        timings: [timings[0].format("HH:mm"), timings[1].format("HH:mm")],
      };
      await axiosInstance.post("/api/user/registerdoc", payload, { headers: authHeader() });
      message.success("Application submitted! An admin will review it shortly.");
      navigate("/userhome");
    } catch (err) {
      message.error(err.response?.data?.message || "Submission failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const fp = (name) => ({
    value: fields[name],
    onChange: setField,
    focused: focused === name,
    onFocus: setFocused,
    onBlur: setFocused,
    error: errors[name],
  });

  return (
    <div className="dashboard-layout">
      <Sidebar role={sidebarRole} navItems={sidebarNav} userName={userData.fullName || ""} notifCount={0} />

      <main className="dashboard-main">
        <header className="dashboard-header">
          <h3>Apply as a Doctor</h3>
        </header>

        <div className="dashboard-content">
          <div style={{ maxWidth: "760px" }}>

            {/* Info banner */}
            <div className="animate-fade-up" style={{
              background: "var(--dark)", borderRadius: "var(--radius-md)",
              padding: "1.5rem 2rem", marginBottom: "2rem",
              display: "flex", gap: "1rem", alignItems: "flex-start",
            }}>
              <span style={{ fontSize: "1.4rem", flexShrink: 0 }}>🩺</span>
              <div>
                <div style={{
                  fontFamily: "var(--font-display)", fontSize: "1.1rem",
                  color: "var(--accent)", marginBottom: "0.3rem",
                }}>
                  Join our network of specialists
                </div>
                <div style={{
                  fontFamily: "var(--font-body)", fontSize: "0.85rem",
                  fontWeight: 300, color: "var(--neutral)", lineHeight: 1.7,
                }}>
                  Submit your professional details below. Our admin team will
                  review your application and notify you within 2–3 business days.
                </div>
              </div>
            </div>

            {/* Form card */}
            <div className="card-brand animate-fade-up delay-1" style={{ padding: "2.5rem" }}>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                <Field name="fullName" label="Full name (with title)" placeholder="Dr. Juan Dela Cruz" {...fp("fullName")} />
                <Field name="phone"    label="Contact number"         placeholder="09001234567"        {...fp("phone")} />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                <Field name="email"   label="Professional email" placeholder="dr.juan@clinic.com" type="email" {...fp("email")} />
                <Field name="address" label="Clinic address"     placeholder="123 Medical Ave"             {...fp("address")} />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                {/* Specialisation select */}
                <Field name="specialisation" label="Specialisation" error={errors.specialisation}>
                  <select
                    value={fields.specialisation}
                    onChange={(e) => setField("specialisation", e.target.value)}
                    onFocus={() => setFocused("specialisation")}
                    onBlur={() => setFocused(null)}
                    style={{
                      width: "100%", padding: "0.8rem 1rem", boxSizing: "border-box",
                      border: `1.5px solid ${focused === "specialisation" ? "var(--secondary)" : errors.specialisation ? "#c0392b" : "rgba(171,178,144,0.35)"}`,
                      borderRadius: "var(--radius-sm)", fontFamily: "var(--font-body)",
                      fontSize: "0.9rem", fontWeight: 300, color: fields.specialisation ? "var(--text-dark)" : "rgba(116,132,105,0.5)",
                      background: "#fff", outline: "none", cursor: "pointer",
                      boxShadow: focused === "specialisation" ? "0 0 0 3px rgba(116,132,105,0.12)" : "none",
                      transition: "border-color 0.2s, box-shadow 0.2s",
                    }}
                  >
                    <option value="" disabled>Select specialisation</option>
                    {SPECIALISATIONS.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </Field>

                <Field name="experience" label="Years of experience" placeholder="e.g. 8 years" {...fp("experience")} />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                <Field name="fees" label="Consultation fee (₱)" placeholder="500" type="number" {...fp("fees")} />

                {/* Timings */}
                <div style={{ marginBottom: "1rem" }}>
                  <label style={{
                    display: "block", fontFamily: "var(--font-body)", fontSize: "0.72rem",
                    fontWeight: 500, letterSpacing: "0.1em", textTransform: "uppercase",
                    color: "var(--text-mid)", marginBottom: "0.45rem",
                  }}>
                    Consultation hours
                  </label>
                  <TimePicker.RangePicker
                    format="HH:mm"
                    minuteStep={15}
                    value={timings}
                    onChange={(val) => {
                      setTimings(val);
                      if (errors.timings) setErrors((p) => ({ ...p, timings: "" }));
                    }}
                    style={{
                      width: "100%",
                      borderColor: errors.timings ? "#c0392b" : "rgba(171,178,144,0.35)",
                      borderRadius: "var(--radius-sm)",
                    }}
                  />
                  {errors.timings && (
                    <div style={{ fontFamily: "var(--font-body)", fontSize: "0.75rem", color: "#c0392b", marginTop: "0.3rem" }}>
                      {errors.timings}
                    </div>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div style={{ display: "flex", gap: "1rem", marginTop: "0.5rem" }}>
                <button
                  onClick={onSubmit}
                  disabled={loading}
                  className="btn-brand"
                  style={{ opacity: loading ? 0.7 : 1, cursor: loading ? "not-allowed" : "pointer" }}
                >
                  {loading ? "Submitting…" : "Submit Application"}
                </button>
                <button
                  onClick={() => navigate("/userhome")}
                  className="btn-brand-outline"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
