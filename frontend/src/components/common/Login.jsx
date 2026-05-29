import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { message } from "antd";
import axiosInstance from "../../axiosConfig.js";

const STATS = [["500+","Doctors"],["12k","Patients"],["98%","Satisfaction"]];

export default function Login() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [focused, setFocused] = useState(null);
  const [fields,  setFields]  = useState({ email: "", password: "" });
  const [errors,  setErrors]  = useState({});

  const setField = (name, value) => {
    setFields((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const validate = () => {
    const e = {};
    if (!fields.email.trim())    e.email    = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(fields.email)) e.email = "Enter a valid email";
    if (!fields.password)        e.password = "Password is required";
    return e;
  };

  const onSubmit = async () => {
    const e = validate();
    if (Object.keys(e).length > 0) { setErrors(e); return; }
    try {
      setLoading(true);
      const { data } = await axiosInstance.post("/api/user/login", fields);
      localStorage.setItem("token",    data.token);
      localStorage.setItem("userData", JSON.stringify(data.userData));
      message.success("Welcome back!");
      if (data.userData.type === "admin") {
        navigate("/adminhome");
      } else if (data.userData.isdoctor) {
        navigate("/doctorhome");
      } else {
        navigate("/userhome");
      }
    } catch (err) {
      message.error(err.response?.data?.message || "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Allow Enter key to submit
  const onKeyDown = (e) => { if (e.key === "Enter") onSubmit(); };

  const inputStyle = (name) => ({
    width: "100%", padding: "0.85rem 1rem", boxSizing: "border-box",
    border: `1.5px solid ${
      errors[name] ? "#c0392b" : focused === name ? "var(--secondary)" : "rgba(171,178,144,0.35)"
    }`,
    borderRadius: "var(--radius-sm)", fontFamily: "var(--font-body)",
    fontSize: "0.95rem", fontWeight: 300, color: "var(--text-dark)",
    background: "#fff", outline: "none",
    boxShadow: focused === name ? "0 0 0 3px rgba(116,132,105,0.12)" : "none",
    transition: "border-color 0.2s, box-shadow 0.2s",
  });

  const errorMsg = (name) => errors[name] ? (
    <div style={{
      fontFamily: "var(--font-body)", fontSize: "0.75rem",
      color: "#c0392b", marginTop: "0.3rem",
    }}>
      {errors[name]}
    </div>
  ) : null;

  return (
    <div style={{
      minHeight: "100vh", display: "grid",
      gridTemplateColumns: "1fr 1fr", background: "var(--surface)",
    }}>
      <style>{`
        input::placeholder { color: rgba(116,132,105,0.5); }
        .back-link { color: var(--text-light) !important; transition: color 0.2s ease; text-decoration: none; }
        .back-link:hover { color: var(--secondary) !important; }
      `}</style>

      {/* ── Left decorative panel ─────────────────────────────── */}
      <div style={{
        background: "var(--dark)", display: "flex", flexDirection: "column",
        justifyContent: "space-between", padding: "3rem",
        position: "relative", overflow: "hidden",
      }}>
        {[
          { top: "-80px", right: "-80px", width: "320px", height: "320px", border: "1px solid rgba(171,178,144,0.15)" },
          { top: "-40px", right: "-40px", width: "200px", height: "200px", background: "rgba(171,178,144,0.07)" },
          { bottom: "10%", left: "-60px", width: "240px", height: "240px", border: "1px solid rgba(249,234,215,0.08)" },
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
          <p style={{
            fontFamily: "var(--font-display)", fontSize: "clamp(1.8rem,3vw,2.8rem)",
            fontWeight: 300, fontStyle: "italic", color: "var(--accent)",
            lineHeight: 1.3, marginBottom: "1.5rem",
          }}>
            "The greatest wealth is health."
          </p>
          <span style={{
            fontFamily: "var(--font-body)", fontSize: "0.8rem", fontWeight: 400,
            letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--neutral)",
          }}>
            — Virgil
          </span>
        </div>

        <div style={{ position: "relative", zIndex: 1, display: "flex", gap: "2rem" }}
          className="animate-fade-up delay-2">
          {STATS.map(([n, l]) => (
            <div key={l}>
              <span style={{
                fontFamily: "var(--font-display)", fontSize: "1.8rem",
                fontWeight: 300, color: "var(--primary)", display: "block",
              }}>{n}</span>
              <span style={{
                fontFamily: "var(--font-body)", fontSize: "0.7rem",
                letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--neutral)",
              }}>{l}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Right form panel ──────────────────────────────────── */}
      <div style={{
        display: "flex", flexDirection: "column", justifyContent: "center",
        padding: "4rem", maxWidth: "560px", width: "100%", justifySelf: "center",
      }} className="animate-fade-up">

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
          Welcome back
        </div>

        <h1 style={{
          fontFamily: "var(--font-display)", fontSize: "clamp(2rem,3.5vw,2.8rem)",
          fontWeight: 300, color: "var(--text-dark)", marginBottom: "0.5rem", lineHeight: 1.2,
        }}>
          Sign in to your account
        </h1>
        <p style={{
          fontFamily: "var(--font-body)", fontSize: "0.9rem", fontWeight: 300,
          color: "var(--text-light)", marginBottom: "2.5rem", lineHeight: 1.7,
        }}>
          Don't have an account?{" "}
          <Link to="/register" style={{ color: "var(--secondary)", fontWeight: 500, textDecoration: "none" }}>
            Create one free
          </Link>
        </p>

        {/* Email */}
        <div style={{ marginBottom: "1.25rem" }}>
          <label style={{
            display: "block", fontFamily: "var(--font-body)", fontSize: "0.72rem",
            fontWeight: 500, letterSpacing: "0.1em", textTransform: "uppercase",
            color: "var(--text-mid)", marginBottom: "0.5rem",
          }}>
            Email address
          </label>
          <input
            type="email"
            value={fields.email}
            placeholder="you@example.com"
            autoComplete="email"
            onChange={(e) => setField("email", e.target.value)}
            onFocus={() => setFocused("email")}
            onBlur={() => setFocused(null)}
            onKeyDown={onKeyDown}
            style={inputStyle("email")}
          />
          {errorMsg("email")}
        </div>

        {/* Password */}
        <div style={{ marginBottom: "1.5rem" }}>
          <label style={{
            display: "block", fontFamily: "var(--font-body)", fontSize: "0.72rem",
            fontWeight: 500, letterSpacing: "0.1em", textTransform: "uppercase",
            color: "var(--text-mid)", marginBottom: "0.5rem",
          }}>
            Password
          </label>
          <input
            type="password"
            value={fields.password}
            placeholder="Your password"
            autoComplete="current-password"
            onChange={(e) => setField("password", e.target.value)}
            onFocus={() => setFocused("password")}
            onBlur={() => setFocused(null)}
            onKeyDown={onKeyDown}
            style={inputStyle("password")}
          />
          {errorMsg("password")}
        </div>

        <button
          onClick={onSubmit}
          disabled={loading}
          style={{
            width: "100%", padding: "0.95rem", background: "var(--secondary)",
            color: "var(--font-color)", border: "none", borderRadius: "var(--radius-sm)",
            fontFamily: "var(--font-body)", fontSize: "0.85rem", fontWeight: 500,
            letterSpacing: "0.1em", textTransform: "uppercase",
            cursor: loading ? "not-allowed" : "pointer",
            transition: "all 0.3s ease", opacity: loading ? 0.7 : 1,
          }}
        >
          {loading ? "Signing in…" : "Sign In"}
        </button>

        <div style={{ display: "flex", alignItems: "center", gap: "1rem", margin: "1.5rem 0" }}>
          <div style={{ flex: 1, height: "1px", background: "rgba(171,178,144,0.3)" }} />
          <span style={{ fontFamily: "var(--font-body)", fontSize: "0.75rem", color: "var(--text-light)" }}>or</span>
          <div style={{ flex: 1, height: "1px", background: "rgba(171,178,144,0.3)" }} />
        </div>

        <div style={{ textAlign: "center", fontFamily: "var(--font-body)", fontSize: "0.875rem", color: "var(--text-light)" }}>
          New to MediCareBook?{" "}
          <Link to="/register" style={{ color: "var(--secondary)", fontWeight: 500, textDecoration: "none" }}>
            Create a free account →
          </Link>
        </div>
      </div>
    </div>
  );
}
