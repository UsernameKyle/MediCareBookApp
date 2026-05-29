import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { message } from "antd";
import axiosInstance from "../../axiosConfig.js";

/* ─── TextField defined OUTSIDE the component ───────────────────────
   Defining it inside Register causes React to treat it as a new
   component type on every render → unmount/remount → lost focus.
   Moving it outside gives it a stable identity across renders.     */
function TextField({ name, label, placeholder, type = "text", value, onChange, focused, onFocus, onBlur, error }) {
  return (
    <div style={{ marginBottom: "1rem" }}>
      <label style={{
        display: "block", fontFamily: "var(--font-body)", fontSize: "0.72rem",
        fontWeight: 500, letterSpacing: "0.1em", textTransform: "uppercase",
        color: "var(--text-mid)", marginBottom: "0.45rem",
      }}>
        {label}
      </label>
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        autoComplete={type === "password" ? "new-password" : name}
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

const STEPS = [
  "Create your free account with basic info",
  "Browse our verified specialist directory",
  "Book appointments and manage your care",
];

export default function Register() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [focused, setFocused] = useState(null);

  const [fields, setFields] = useState({
    fullName: "", phone: "", email: "", password: "",
  });
  const [errors, setErrors] = useState({});

  const setField = (name, value) => {
    setFields((prev) => ({ ...prev, [name]: value }));
    // Clear error on change
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const validate = () => {
    const e = {};
    if (!fields.fullName.trim())  e.fullName = "Full name is required";
    if (!fields.phone.trim())     e.phone    = "Phone number is required";
    if (!fields.email.trim())     e.email    = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(fields.email)) e.email = "Enter a valid email";
    if (!fields.password)         e.password = "Password is required";
    else if (fields.password.length < 6) e.password = "Minimum 6 characters";
    return e;
  };

  const onSubmit = async () => {
    const e = validate();
    if (Object.keys(e).length > 0) {
      setErrors(e);
      return;
    }
    try {
      setLoading(true);
      await axiosInstance.post("/api/user/register", fields);
      message.success("Account created! Please sign in.");
      navigate("/login");
    } catch (err) {
      message.error(err.response?.data?.message || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: "100vh", background: "var(--surface)",
      display: "flex", alignItems: "stretch",
    }}>
      <style>{`
        input::placeholder { color: rgba(116,132,105,0.5); }
        .back-link { color: var(--text-light) !important; transition: color 0.2s ease; text-decoration: none; }
        .back-link:hover { color: var(--secondary) !important; }
        .register-select .ant-select-selector {
          border: 1.5px solid rgba(171,178,144,0.35) !important;
          border-radius: var(--radius-sm) !important;
          height: auto !important; padding: 0.55rem 1rem !important;
          font-family: var(--font-body) !important; font-size: 0.9rem !important;
          font-weight: 300 !important; color: var(--text-dark) !important;
        }
        .register-select.ant-select-focused .ant-select-selector {
          border-color: var(--secondary) !important;
          box-shadow: 0 0 0 3px rgba(116,132,105,0.12) !important;
        }
      `}</style>

      {/* ── Left decorative panel ─────────────────────────────── */}
      <div style={{
        flex: "0 0 420px", background: "var(--dark)", display: "flex",
        flexDirection: "column", justifyContent: "space-between",
        padding: "3rem", position: "relative", overflow: "hidden",
      }}>
        {/* Decorative circles */}
        {[
          { bottom: "15%", right: "-60px", width: "280px", height: "280px", border: "1px solid rgba(171,178,144,0.12)" },
          { top: "20%", left: "-40px", width: "160px", height: "160px", background: "rgba(249,234,215,0.05)" },
          { bottom: "-40px", right: "20%", width: "200px", height: "200px", background: "rgba(171,178,144,0.06)" },
        ].map((s, i) => (
          <div key={i} style={{ position: "absolute", borderRadius: "50%", ...s }} />
        ))}

        <Link to="/" style={{
          fontFamily: "var(--font-display)", fontSize: "1.6rem", fontWeight: 400,
          color: "var(--accent)", textDecoration: "none", position: "relative", zIndex: 1,
        }}>
          Medi<span style={{ color: "var(--primary)" }}>Care</span>Book
        </Link>

        <div style={{ position: "relative", zIndex: 1 }} className="animate-fade-up">
          <h2 style={{
            fontFamily: "var(--font-display)", fontSize: "2.2rem", fontWeight: 300,
            color: "var(--accent)", lineHeight: 1.25, marginBottom: "1.25rem",
          }}>
            Start your care journey today
          </h2>
          <p style={{
            fontFamily: "var(--font-body)", fontSize: "0.875rem",
            fontWeight: 300, color: "var(--neutral)", lineHeight: 1.8,
          }}>
            Join thousands of patients who've simplified their healthcare with MediCareBook.
          </p>
        </div>

        <ul style={{ position: "relative", zIndex: 1, listStyle: "none", padding: 0, margin: 0 }}
          className="animate-fade-up delay-1">
          {STEPS.map((s, i) => (
            <li key={i} style={{ display: "flex", alignItems: "flex-start", gap: "1rem", marginBottom: "1.25rem" }}>
              <div style={{
                flexShrink: 0, width: "28px", height: "28px", borderRadius: "50%",
                border: "1px solid rgba(171,178,144,0.4)", display: "flex",
                alignItems: "center", justifyContent: "center",
                fontFamily: "var(--font-display)", fontSize: "0.85rem", color: "var(--primary)",
              }}>
                {i + 1}
              </div>
              <div style={{
                fontFamily: "var(--font-body)", fontSize: "0.82rem",
                fontWeight: 300, color: "var(--neutral)", lineHeight: 1.6, paddingTop: "0.3rem",
              }}>
                {s}
              </div>
            </li>
          ))}
        </ul>
      </div>

      {/* ── Right form panel ──────────────────────────────────── */}
      <div style={{
        flex: 1, display: "flex", alignItems: "center",
        justifyContent: "center", padding: "4rem 3rem",
      }}>
        <div style={{ width: "100%", maxWidth: "520px" }} className="animate-fade-up">

          <Link to="/" className="back-link" style={{
            display: "inline-flex", alignItems: "center", gap: "0.4rem",
            fontFamily: "var(--font-body)", fontSize: "0.8rem", fontWeight: 400,
            letterSpacing: "0.06em", marginBottom: "2rem",
          }}>
            ← Back to home
          </Link>

          <div style={{
            fontFamily: "var(--font-body)", fontSize: "0.72rem", fontWeight: 500,
            letterSpacing: "0.18em", textTransform: "uppercase", color: "var(--secondary)",
            marginBottom: "0.75rem", display: "flex", alignItems: "center", gap: "0.5rem",
          }}>
            <span style={{ width: "24px", height: "1px", background: "var(--secondary)", display: "inline-block" }} />
            New account
          </div>

          <h1 style={{
            fontFamily: "var(--font-display)", fontSize: "clamp(1.8rem, 3vw, 2.6rem)",
            fontWeight: 300, color: "var(--text-dark)", marginBottom: "0.4rem", lineHeight: 1.2,
          }}>
            Create your account
          </h1>
          <p style={{
            fontFamily: "var(--font-body)", fontSize: "0.875rem",
            fontWeight: 300, color: "var(--text-light)", marginBottom: "2rem",
          }}>
            Already have one?{" "}
            <Link to="/login" style={{ color: "var(--secondary)", fontWeight: 500, textDecoration: "none" }}>
              Sign in here
            </Link>
          </p>

          {/* ── Form fields — no Form wrapper, pure controlled state ── */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
            <TextField
              name="fullName" label="Full name" placeholder="Juan Dela Cruz"
              value={fields.fullName} onChange={setField}
              focused={focused === "fullName"} onFocus={setFocused} onBlur={setFocused}
              error={errors.fullName}
            />
            <TextField
              name="phone" label="Phone" placeholder="09001234567"
              value={fields.phone} onChange={setField}
              focused={focused === "phone"} onFocus={setFocused} onBlur={setFocused}
              error={errors.phone}
            />
          </div>

          <TextField
            name="email" label="Email address" placeholder="you@example.com" type="email"
            value={fields.email} onChange={setField}
            focused={focused === "email"} onFocus={setFocused} onBlur={setFocused}
            error={errors.email}
          />
          <TextField
            name="password" label="Password" placeholder="Min. 6 characters" type="password"
            value={fields.password} onChange={setField}
            focused={focused === "password"} onFocus={setFocused} onBlur={setFocused}
            error={errors.password}
          />

          {/* Account type is always "user" — admins are created by existing admins only */}

          <button
            onClick={onSubmit}
            disabled={loading}
            style={{
              width: "100%", padding: "0.95rem", background: "var(--secondary)",
              color: "var(--font-color)", border: "none", borderRadius: "var(--radius-sm)",
              fontFamily: "var(--font-body)", fontSize: "0.85rem", fontWeight: 500,
              letterSpacing: "0.1em", textTransform: "uppercase", cursor: loading ? "not-allowed" : "pointer",
              transition: "all 0.3s ease", opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? "Creating account…" : "Create Account"}
          </button>

          <div style={{
            marginTop: "1.5rem", textAlign: "center",
            fontFamily: "var(--font-body)", fontSize: "0.875rem", color: "var(--text-light)",
          }}>
            By registering you agree to our{" "}
            <span style={{ color: "var(--secondary)" }}>Terms of Service</span>
          </div>
        </div>
      </div>
    </div>
  );
}
