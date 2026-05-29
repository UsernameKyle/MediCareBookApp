import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { TimePicker, message } from "antd";
import dayjs from "dayjs";
import Sidebar from "../common/Sidebar.jsx";
import { DOCTOR_NAV } from "./DoctorHome.jsx";
import axiosInstance, { authHeader } from "../../axiosConfig.js";

const SPECIALISATIONS = [
  "General Practice","Cardiology","Dermatology","Endocrinology",
  "Gastroenterology","Neurology","Obstetrics & Gynaecology",
  "Oncology","Ophthalmology","Orthopaedics","Paediatrics",
  "Psychiatry","Pulmonology","Radiology","Urology",
];

/* ── Field defined outside component to prevent remount ── */
function Field({ name, label, placeholder, type = "text", value, onChange, focused, onFocus, onBlur, error, children }) {
  return (
    <div style={{ marginBottom: "1rem" }}>
      <label style={{ display: "block", fontFamily: "var(--font-body)", fontSize: "0.72rem", fontWeight: 500, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-mid)", marginBottom: "0.45rem" }}>
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
      {error && <div style={{ fontFamily: "var(--font-body)", fontSize: "0.75rem", color: "#c0392b", marginTop: "0.3rem" }}>{error}</div>}
    </div>
  );
}

export default function DoctorProfile() {
  const navigate = useNavigate();
  const userData = JSON.parse(localStorage.getItem("userData") || "{}");
  const [loading,  setLoading]  = useState(true);
  const [saving,   setSaving]   = useState(false);
  const [focused,  setFocused]  = useState(null);
  const [timings,  setTimings]  = useState(null);
  const [fields,   setFields]   = useState({
    fullName: "", phone: "", email: "", address: "",
    specialisation: "", experience: "", fees: "",
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        // Get all doctors and find the one matching this user
        const { data } = await axiosInstance.get("/api/user/getalldoctorsu", { headers: authHeader() });
        const myProfile = data.data.find((d) => d.userId === userData._id || d.userId?._id === userData._id);
        if (myProfile) {
          setFields({
            fullName:      myProfile.fullName      || "",
            phone:         myProfile.phone         || "",
            email:         myProfile.email         || "",
            address:       myProfile.address       || "",
            specialisation:myProfile.specialisation|| "",
            experience:    myProfile.experience    || "",
            fees:          myProfile.fees?.toString()|| "",
          });
          if (myProfile.timings?.length === 2) {
            setTimings([dayjs(myProfile.timings[0], "HH:mm"), dayjs(myProfile.timings[1], "HH:mm")]);
          }
        }
      } catch { message.error("Failed to load profile."); }
      finally  { setLoading(false); }
    };
    fetchProfile();
  }, []);

  const setField = (name, value) => {
    setFields((p) => ({ ...p, [name]: value }));
    if (errors[name]) setErrors((p) => ({ ...p, [name]: "" }));
  };

  const validate = () => {
    const e = {};
    if (!fields.fullName.trim())   e.fullName      = "Required";
    if (!fields.phone.trim())      e.phone         = "Required";
    if (!fields.email.trim())      e.email         = "Required";
    if (!fields.address.trim())    e.address       = "Required";
    if (!fields.specialisation)    e.specialisation= "Required";
    if (!fields.experience.trim()) e.experience    = "Required";
    if (!fields.fees)              e.fees          = "Required";
    if (!timings)                  e.timings       = "Required";
    return e;
  };

  const onSave = async () => {
    const e = validate();
    if (Object.keys(e).length > 0) { setErrors(e); return; }
    try {
      setSaving(true);
      await axiosInstance.post("/api/doctor/updateprofile", {
        ...fields,
        fees: Number(fields.fees),
        timings: [timings[0].format("HH:mm"), timings[1].format("HH:mm")],
      }, { headers: authHeader() });
      message.success("Profile updated successfully");
    } catch (err) {
      message.error(err.response?.data?.message || "Failed to update profile.");
    } finally {
      setSaving(false);
    }
  };

  const fp = (name) => ({
    value: fields[name], onChange: setField,
    focused: focused === name, onFocus: setFocused, onBlur: setFocused,
    error: errors[name],
  });

  return (
    <div className="dashboard-layout">
      <Sidebar role="doctor" navItems={DOCTOR_NAV} userName={userData.fullName || ""} notifCount={0} />

      <main className="dashboard-main">
        <header className="dashboard-header">
          <h3>My Profile</h3>
        </header>

        <div className="dashboard-content">
          <div style={{ maxWidth: "760px" }}>
            {loading ? (
              <div style={{ fontFamily: "var(--font-body)", color: "var(--text-light)", padding: "2rem 0" }}>Loading profile…</div>
            ) : (
              <div className="card-brand animate-fade-up" style={{ padding: "2.5rem" }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                  <Field name="fullName" label="Full name" placeholder="Dr. Juan Dela Cruz" {...fp("fullName")} />
                  <Field name="phone"    label="Phone"     placeholder="09001234567"        {...fp("phone")} />
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                  <Field name="email"   label="Email"          placeholder="dr@clinic.com"  type="email" {...fp("email")} />
                  <Field name="address" label="Clinic address"  placeholder="123 Medical Ave" {...fp("address")} />
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                  <Field name="specialisation" label="Specialisation" error={errors.specialisation}>
                    <select
                      value={fields.specialisation}
                      onChange={(e) => setField("specialisation", e.target.value)}
                      onFocus={() => setFocused("specialisation")}
                      onBlur={() => setFocused(null)}
                      style={{
                        width: "100%", padding: "0.8rem 1rem", boxSizing: "border-box",
                        border: `1.5px solid ${focused === "specialisation" ? "var(--secondary)" : "rgba(171,178,144,0.35)"}`,
                        borderRadius: "var(--radius-sm)", fontFamily: "var(--font-body)",
                        fontSize: "0.9rem", fontWeight: 300, color: "var(--text-dark)",
                        background: "#fff", outline: "none", cursor: "pointer",
                      }}
                    >
                      <option value="" disabled>Select specialisation</option>
                      {SPECIALISATIONS.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </Field>
                  <Field name="experience" label="Experience" placeholder="8 years" {...fp("experience")} />
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                  <Field name="fees" label="Consultation fee (₱)" placeholder="500" type="number" {...fp("fees")} />
                  <div style={{ marginBottom: "1rem" }}>
                    <label style={{ display: "block", fontFamily: "var(--font-body)", fontSize: "0.72rem", fontWeight: 500, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-mid)", marginBottom: "0.45rem" }}>
                      Consultation hours
                    </label>
                    <TimePicker.RangePicker
                      format="HH:mm" minuteStep={15} value={timings}
                      onChange={(val) => { setTimings(val); if (errors.timings) setErrors((p) => ({ ...p, timings: "" })); }}
                      style={{ width: "100%", borderColor: errors.timings ? "#c0392b" : "rgba(171,178,144,0.35)", borderRadius: "var(--radius-sm)" }}
                    />
                    {errors.timings && <div style={{ fontFamily: "var(--font-body)", fontSize: "0.75rem", color: "#c0392b", marginTop: "0.3rem" }}>{errors.timings}</div>}
                  </div>
                </div>
                <div style={{ display: "flex", gap: "1rem", marginTop: "0.5rem" }}>
                  <button onClick={onSave} disabled={saving} className="btn-brand" style={{ opacity: saving ? 0.7 : 1, cursor: saving ? "not-allowed" : "pointer" }}>
                    {saving ? "Saving…" : "Save Changes"}
                  </button>
                  <button onClick={() => navigate("/doctorhome")} className="btn-brand-outline">Cancel</button>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
