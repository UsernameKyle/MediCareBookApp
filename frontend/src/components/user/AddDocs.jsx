import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { message, Modal } from "antd";
import Sidebar from "../common/Sidebar.jsx";
import { useUserNav } from "../common/useUserNav.js";
import { DOCTOR_NAV } from "../doctor/DoctorHome.jsx";
import axiosInstance, { authHeader } from "../../axiosConfig.js";

export default function AddDocs() {
  const navigate  = useNavigate();
  const { role, navItems, userData } = useUserNav();
  const isDoctor = userData?.isdoctor === true;
  const sidebarNav = isDoctor ? DOCTOR_NAV : navItems;
  const sidebarRole = isDoctor ? "doctor" : role;
  const [docs, setDocs]     = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDocs = async () => {
      try {
        const { data } = await axiosInstance.get(
          "/api/user/getDocsforuser",
          { headers: authHeader() }
        );
        setDocs(data.data || []);
      } catch {
        message.error("Failed to load documents.");
      } finally {
        setLoading(false);
      }
    };
    fetchDocs();
  }, []);

  const confirmDeleteDoc = (doc) => {
    Modal.confirm({
      title: "Delete document",
      content: "Are you sure you want to delete this document?",
      okText: "Delete",
      okType: "danger",
      cancelText: "Cancel",
      onOk: async () => {
        try {
          await axiosInstance.post("/api/user/deletedocument", { path: doc.path, name: doc.name }, { headers: authHeader() });
          setDocs((prev) => prev.filter((d) => d.path !== doc.path));
          message.success("Document deleted");
        } catch (err) {
          message.error(err.response?.data?.message || "Failed to delete document.");
        }
      },
    });
  };

  const downloadUserDocument = async (doc) => {
    try {
      const resp = await axiosInstance.get(
        `/api/user/getdocumentdownload?path=${encodeURIComponent(doc.path || "")}&name=${encodeURIComponent(doc.name || "")}`,
        { headers: authHeader(), responseType: "blob" }
      );

      const url = window.URL.createObjectURL(new Blob([resp.data]));
      const a = document.createElement("a");
      a.href = url;
      a.download = doc.name || "document";
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      message.error(err.response?.data?.message || "Failed to download document.");
    }
  };

  const fileIcon = (name = "") => {
    if (name.endsWith(".pdf"))  return "📕";
    if (name.match(/\.(jpg|jpeg|png|gif)$/i)) return "🖼️";
    if (name.match(/\.(doc|docx)$/i)) return "📝";
    return "📄";
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
          <h3>My Documents</h3>
        </header>

        <div className="dashboard-content">
          <div style={{ maxWidth: "760px" }}>
            {/* Info */}
            <div className="animate-fade-up" style={{
              background: "var(--surface-mid)",
              borderRadius: "var(--radius-md)",
              padding: "1.25rem 1.75rem",
              marginBottom: "2rem",
              display: "flex",
              gap: "0.75rem",
              alignItems: "center",
              border: "1px solid rgba(171,178,144,0.2)",
            }}>
              <span style={{ fontSize: "1.2rem" }}>ℹ️</span>
              <p style={{
                fontFamily: "var(--font-body)",
                fontSize: "0.85rem",
                fontWeight: 300,
                color: "var(--text-mid)",
                margin: 0,
                lineHeight: 1.7,
              }}>
                Documents are automatically attached to your appointments.
                Upload records, referrals, and test results when booking.
              </p>
            </div>

            {/* Document list */}
            {loading ? (
              <div style={{
                fontFamily: "var(--font-body)",
                fontSize: "0.85rem",
                color: "var(--text-light)",
                padding: "2rem 0",
              }}>
                Loading documents…
              </div>
            ) : docs.length === 0 ? (
              <div className="animate-fade-up" style={{
                textAlign: "center",
                padding: "5rem 2rem",
              }}>
                <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>📂</div>
                <h3 style={{
                  fontFamily: "var(--font-display)",
                  fontWeight: 400,
                  fontSize: "1.5rem",
                  color: "var(--text-dark)",
                  marginBottom: "0.5rem",
                }}>
                  No documents yet
                </h3>
                <p style={{
                  fontFamily: "var(--font-body)",
                  color: "var(--text-light)",
                  fontWeight: 300,
                  marginBottom: "1.5rem",
                }}>
                  Attach documents when booking an appointment and they'll appear here.
                </p>
                <button
                  className="btn-brand"
                  onClick={() => navigate("/appointments")}
                >
                  Book an Appointment
                </button>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                {docs.map((doc, i) => (
                  <div
                    key={doc._id || i}
                    className={`card-brand animate-fade-up delay-${(i % 4) + 1}`}
                    style={{
                      padding: "1.25rem 1.75rem",
                      display: "flex",
                      alignItems: "center",
                      gap: "1.25rem",
                    }}
                  >
                    <span style={{ fontSize: "2rem", flexShrink: 0 }}>
                      {fileIcon(doc.name)}
                    </span>
                    <div style={{ flex: 1 }}>
                      <div style={{
                        fontFamily: "var(--font-display)",
                        fontSize: "1rem",
                        color: "var(--text-dark)",
                        marginBottom: "0.2rem",
                      }}>
                        {doc.name || "Untitled document"}
                      </div>
                      {doc.path && (
                        <div style={{
                          fontFamily: "var(--font-body)",
                          fontSize: "0.75rem",
                          color: "var(--text-light)",
                        }}>
                          {doc.path}
                        </div>
                      )}
                    </div>
                    <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
                      <span style={{
                      padding: "0.3rem 0.85rem",
                      borderRadius: "20px",
                      background: "var(--surface-mid)",
                      fontFamily: "var(--font-body)",
                      fontSize: "0.7rem",
                      color: "var(--text-light)",
                      letterSpacing: "0.06em",
                      textTransform: "uppercase",
                    }}>
                      {(doc.name || "").split(".").pop() || "file"}
                    </span>
                      <button
                        onClick={() => downloadUserDocument(doc)}
                        style={{ background: "none", border: "1px solid rgba(116,132,105,0.35)", padding: "0.45rem 0.9rem", borderRadius: "var(--radius-sm)", color: "var(--secondary)", cursor: "pointer" }}
                      >
                        📎 View
                      </button>
                      <button
                        onClick={() => confirmDeleteDoc(doc)}
                        style={{ background: "none", border: "1px solid rgba(197,100,100,0.35)", padding: "0.45rem 0.9rem", borderRadius: "var(--radius-sm)", color: "#c0392b", cursor: "pointer" }}
                      >
                        🗑 Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
