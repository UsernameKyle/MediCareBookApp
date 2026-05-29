import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";

/* ─── Inline styles scoped to this page ─────────────────────────── */
const styles = {
  page: {
    minHeight: "100vh",
    background: "var(--surface)",
    overflowX: "hidden",
  },

  /* NAV */
  nav: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 200,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "1.25rem 3rem",
    transition: "all 0.4s ease",
  },
  navScrolled: {
    background: "rgba(244,241,235,0.95)",
    backdropFilter: "blur(16px)",
    borderBottom: "1px solid rgba(171,178,144,0.25)",
    padding: "0.85rem 3rem",
    boxShadow: "0 2px 20px rgba(44,51,40,0.06)",
  },
  navLogo: {
    fontFamily: "var(--font-display)",
    fontSize: "1.6rem",
    fontWeight: 400,
    color: "var(--text-dark)",
    letterSpacing: "0.02em",
    textDecoration: "none",
  },
  navLogoAccent: {
    color: "var(--secondary)",
  },
  navLinks: {
    display: "flex",
    alignItems: "center",
    gap: "2rem",
    listStyle: "none",
    margin: 0,
    padding: 0,
  },
  navLink: {
    fontFamily: "var(--font-body)",
    fontSize: "0.85rem",
    fontWeight: 400,
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    color: "var(--text-mid)",
    textDecoration: "none",
    transition: "color 0.3s ease",
  },

  /* HERO */
  hero: {
    minHeight: "100vh",
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    alignItems: "center",
    padding: "0 3rem",
    paddingTop: "6rem",
    gap: "4rem",
    position: "relative",
    overflow: "hidden",
  },
  heroLeft: {
    maxWidth: "580px",
  },
  heroEyebrow: {
    display: "inline-flex",
    alignItems: "center",
    gap: "0.6rem",
    fontFamily: "var(--font-body)",
    fontSize: "0.75rem",
    fontWeight: 500,
    letterSpacing: "0.15em",
    textTransform: "uppercase",
    color: "var(--secondary)",
    marginBottom: "1.5rem",
  },
  heroEyebrowLine: {
    width: "32px",
    height: "1px",
    background: "var(--secondary)",
  },
  heroTitle: {
    fontFamily: "var(--font-display)",
    fontSize: "clamp(3rem, 6vw, 5.5rem)",
    fontWeight: 300,
    lineHeight: 1.1,
    color: "var(--text-dark)",
    marginBottom: "1.5rem",
    letterSpacing: "-0.01em",
  },
  heroTitleItalic: {
    fontStyle: "italic",
    color: "var(--secondary)",
  },
  heroSubtitle: {
    fontFamily: "var(--font-body)",
    fontSize: "1.05rem",
    fontWeight: 300,
    color: "var(--text-mid)",
    lineHeight: 1.8,
    marginBottom: "2.5rem",
    maxWidth: "440px",
  },
  heroCta: {
    display: "flex",
    gap: "1rem",
    flexWrap: "wrap",
  },
  heroRight: {
    position: "relative",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  heroCard: {
    background: "var(--dark)",
    borderRadius: "var(--radius-lg)",
    padding: "3rem",
    width: "100%",
    maxWidth: "420px",
    position: "relative",
    overflow: "hidden",
  },
  heroCardDecor: {
    position: "absolute",
    top: "-40px",
    right: "-40px",
    width: "180px",
    height: "180px",
    borderRadius: "50%",
    background: "rgba(171,178,144,0.15)",
  },
  heroCardDecor2: {
    position: "absolute",
    bottom: "-30px",
    left: "-30px",
    width: "120px",
    height: "120px",
    borderRadius: "50%",
    background: "rgba(249,234,215,0.08)",
  },
  heroStat: {
    marginBottom: "2rem",
  },
  heroStatNumber: {
    fontFamily: "var(--font-display)",
    fontSize: "3rem",
    fontWeight: 300,
    color: "var(--accent)",
    lineHeight: 1,
    display: "block",
  },
  heroStatLabel: {
    fontFamily: "var(--font-body)",
    fontSize: "0.8rem",
    fontWeight: 400,
    letterSpacing: "0.1em",
    textTransform: "uppercase",
    color: "var(--neutral)",
  },
  heroDivider: {
    height: "1px",
    background: "rgba(255,255,255,0.1)",
    margin: "1.5rem 0",
  },
  heroBadge: {
    display: "inline-flex",
    alignItems: "center",
    gap: "0.5rem",
    background: "rgba(171,178,144,0.2)",
    borderRadius: "20px",
    padding: "0.5rem 1rem",
    fontFamily: "var(--font-body)",
    fontSize: "0.75rem",
    color: "var(--primary)",
    letterSpacing: "0.06em",
  },
  heroBadgeDot: {
    width: "6px",
    height: "6px",
    borderRadius: "50%",
    background: "var(--primary)",
    animation: "pulse 2s ease-in-out infinite",
  },

  /* ABOUT SECTION */
  about: {
    padding: "7rem 3rem",
    background: "var(--surface-mid)",
    position: "relative",
  },
  aboutInner: {
    maxWidth: "1100px",
    margin: "0 auto",
    display: "grid",
    gridTemplateColumns: "1fr 2fr",
    gap: "5rem",
    alignItems: "start",
  },
  aboutLabel: {
    fontFamily: "var(--font-body)",
    fontSize: "0.75rem",
    fontWeight: 500,
    letterSpacing: "0.18em",
    textTransform: "uppercase",
    color: "var(--secondary)",
    marginBottom: "1rem",
    display: "block",
  },
  aboutTitle: {
    fontFamily: "var(--font-display)",
    fontSize: "clamp(2rem, 4vw, 3.2rem)",
    fontWeight: 300,
    color: "var(--text-dark)",
    lineHeight: 1.25,
    position: "sticky",
    top: "8rem",
  },
  aboutRight: {},
  aboutParagraph: {
    fontFamily: "var(--font-body)",
    fontSize: "1rem",
    fontWeight: 300,
    color: "var(--text-mid)",
    lineHeight: 1.9,
    marginBottom: "1.5rem",
  },
  aboutFeatures: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "1.5rem",
    marginTop: "3rem",
  },
  aboutFeature: {
    padding: "1.5rem",
    background: "#fff",
    borderRadius: "var(--radius-md)",
    border: "1px solid rgba(171,178,144,0.2)",
    transition: "all 0.3s ease",
  },
  aboutFeatureIcon: {
    fontSize: "1.5rem",
    marginBottom: "0.75rem",
    display: "block",
  },
  aboutFeatureTitle: {
    fontFamily: "var(--font-display)",
    fontSize: "1.1rem",
    fontWeight: 400,
    color: "var(--text-dark)",
    marginBottom: "0.4rem",
  },
  aboutFeatureText: {
    fontFamily: "var(--font-body)",
    fontSize: "0.85rem",
    fontWeight: 300,
    color: "var(--text-light)",
    lineHeight: 1.7,
  },

  /* FOOTER */
  footer: {
    background: "var(--dark)",
    padding: "3rem",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: "1rem",
  },
  footerLogo: {
    fontFamily: "var(--font-display)",
    fontSize: "1.4rem",
    color: "var(--accent)",
    fontWeight: 300,
  },
  footerText: {
    fontFamily: "var(--font-body)",
    fontSize: "0.8rem",
    color: "var(--neutral)",
    letterSpacing: "0.04em",
  },
};

const features = [
  {
    icon: "🩺",
    title: "Verified Doctors",
    text: "Every physician is reviewed and approved by our admin team before accepting patients.",
  },
  {
    icon: "📅",
    title: "Easy Scheduling",
    text: "Book appointments in seconds. Choose your doctor, date, and upload any relevant documents.",
  },
  {
    icon: "🔔",
    title: "Real-time Updates",
    text: "Receive instant notifications when your appointment is confirmed or rescheduled.",
  },
  {
    icon: "🔒",
    title: "Secure & Private",
    text: "Your medical records and personal data are protected with industry-standard encryption.",
  },
];

export default function Home() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div style={styles.page}>
      {/* ── Pulse keyframe injected via style tag ── */}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50%       { opacity: 0.5; transform: scale(0.85); }
        }
        .nav-link-hover:hover { color: var(--text-dark) !important; }
        .feature-card:hover {
          transform: translateY(-4px);
          box-shadow: var(--shadow-md);
          border-color: rgba(171,178,144,0.4) !important;
        }
      `}</style>

      {/* ── Navbar ─────────────────────────────────────────────── */}
      <nav style={{ ...styles.nav, ...(scrolled ? styles.navScrolled : {}) }}>
        <Link to="/" style={styles.navLogo}>
          Medi<span style={styles.navLogoAccent}>Care</span>Book
        </Link>

        <ul style={styles.navLinks}>
          <li>
            <a href="#about" style={styles.navLink} className="nav-link-hover">
              About
            </a>
          </li>
          <li>
            <Link to="/login" style={styles.navLink} className="nav-link-hover">
              Sign In
            </Link>
          </li>
          <li>
            <Link to="/register" className="btn-brand" style={{ padding: "0.6rem 1.4rem" }}>
              Get Started
            </Link>
          </li>
        </ul>
      </nav>

      {/* ── Hero ───────────────────────────────────────────────── */}
      <section style={styles.hero}>
        {/* Left — copy */}
        <div style={styles.heroLeft} className="animate-fade-up">
          <div style={styles.heroEyebrow}>
            <span style={styles.heroEyebrowLine} />
            Healthcare, simplified
          </div>

          <h1 style={styles.heroTitle}>
            Your health,{" "}
            <span style={styles.heroTitleItalic}>on your</span>
            <br />
            schedule.
          </h1>

          <p style={styles.heroSubtitle}>
            Connect with verified specialists, book appointments instantly,
            and manage your entire healthcare journey in one place.
          </p>

          <div style={styles.heroCta}>
            <Link to="/register" className="btn-brand">
              Book an Appointment
            </Link>
            <Link to="/login" className="btn-brand-outline">
              Sign In
            </Link>
          </div>
        </div>

        {/* Right — stats card */}
        <div style={styles.heroRight} className="animate-fade-up delay-2">
          <div style={styles.heroCard}>
            <div style={styles.heroCardDecor} />
            <div style={styles.heroCardDecor2} />

            <div style={{ position: "relative", zIndex: 1 }}>
              <div style={styles.heroStat}>
                <span style={styles.heroStatNumber}>500+</span>
                <span style={styles.heroStatLabel}>Verified Specialists</span>
              </div>

              <div style={styles.heroDivider} />

              <div style={styles.heroStat}>
                <span style={styles.heroStatNumber}>12k</span>
                <span style={styles.heroStatLabel}>Appointments Booked</span>
              </div>

              <div style={styles.heroDivider} />

              <div style={styles.heroStat} className="mb-0">
                <span style={styles.heroStatNumber}>98%</span>
                <span style={styles.heroStatLabel}>Patient Satisfaction</span>
              </div>

              <div style={{ marginTop: "2rem" }}>
                <span style={styles.heroBadge}>
                  <span style={styles.heroBadgeDot} />
                  Appointments available today
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Background decorative circle */}
        <div
          style={{
            position: "absolute",
            top: "10%",
            right: "5%",
            width: "500px",
            height: "500px",
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(171,178,144,0.12) 0%, transparent 70%)",
            zIndex: 0,
            pointerEvents: "none",
          }}
        />
      </section>

      {/* ── About ──────────────────────────────────────────────── */}
      <section id="about" style={styles.about}>
        <div style={styles.aboutInner}>
          {/* Left — sticky heading */}
          <div>
            <span style={styles.aboutLabel}>Who we are</span>
            <h2 style={styles.aboutTitle} className="animate-fade-up">
              Bringing care closer to you
            </h2>
          </div>

          {/* Right — content */}
          <div style={styles.aboutRight} className="animate-fade-up delay-1">
            <p style={styles.aboutParagraph}>
              MediCareBook was built with a single belief: accessing quality
              healthcare should be effortless. We connect patients with verified,
              specialist physicians — removing the friction of traditional booking
              systems and putting you in control of your own care.
            </p>
            <p style={styles.aboutParagraph}>
              Our platform serves three distinct roles — patients who need care,
              doctors who provide it, and administrators who ensure the highest
              standards. Every interaction is secured with industry-grade
              encryption and role-based access control.
            </p>

            {/* Feature grid */}
            <div style={styles.aboutFeatures}>
              {features.map((f, i) => (
                <div
                  key={f.title}
                  style={styles.aboutFeature}
                  className={`feature-card animate-fade-up delay-${i + 2}`}
                >
                  <span style={styles.aboutFeatureIcon}>{f.icon}</span>
                  <div style={styles.aboutFeatureTitle}>{f.title}</div>
                  <div style={styles.aboutFeatureText}>{f.text}</div>
                </div>
              ))}
            </div>

            {/* CTA row */}
            <div style={{ marginTop: "3rem" }}>
              <Link to="/register" className="btn-brand">
                Create Free Account
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ─────────────────────────────────────────────── */}
      <footer style={styles.footer}>
        <div style={styles.footerLogo}>MediCareBook</div>
        <div style={styles.footerText}>
          © {new Date().getFullYear()} MediCareBook. All rights reserved.
        </div>
        <div style={{ display: "flex", gap: "1.5rem" }}>
          <Link to="/login" style={{ ...styles.footerText, textDecoration: "none" }}>
            Sign In
          </Link>
          <Link to="/register" style={{ ...styles.footerText, textDecoration: "none" }}>
            Register
          </Link>
        </div>
      </footer>
    </div>
  );
}
