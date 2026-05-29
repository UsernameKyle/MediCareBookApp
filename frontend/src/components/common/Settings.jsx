import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { TimePicker, message, Modal } from "antd";
import dayjs from "dayjs";
import Sidebar from "./Sidebar.jsx";
import { useUserNav } from "./useUserNav.js";
import { DOCTOR_NAV } from "../doctor/DoctorHome.jsx";
import axiosInstance, { authHeader } from "../../axiosConfig.js";

export default function Settings() {
  const navigate = useNavigate();
  const { role, navItems, userData } = useUserNav();
  const isDoctor = userData?.isdoctor === true;
  const [loading, setLoading] = useState(true);

  // Account fields
  const [account, setAccount] = useState({ fullName: "", email: "", phone: "", password: "" });
  const [savingAccount, setSavingAccount] = useState(false);

  // Doctor profile fields (if doctor)
  const [docFields, setDocFields] = useState({ fullName: "", phone: "", email: "", address: "", specialisation: "", experience: "", fees: "" });
  const [timings, setTimings] = useState(null);
  const [savingDoctor, setSavingDoctor] = useState(false);

  useEffect(() => {
    const fetch = async () => {
      try {
        const { data } = await axiosInstance.post("/api/user/getuserdata", {}, { headers: authHeader() });
        const u = data.data;
        setAccount({ fullName: u.fullName || "", email: u.email || "", phone: u.phone || "", password: "" });

        if (isDoctor) {
          // fetch doctor profile
          const { data: dd } = await axiosInstance.get("/api/user/getalldoctorsu", { headers: authHeader() });
          const myProfile = dd.data.find((d) => d.userId === u._id || d.userId?._id === u._id);
          if (myProfile) {
            setDocFields({
              fullName: myProfile.fullName || "",
              phone: myProfile.phone || "",
              email: myProfile.email || "",
              address: myProfile.address || "",
              specialisation: myProfile.specialisation || "",
              experience: myProfile.experience || "",
              fees: myProfile.fees?.toString() || "",
            });
            if (myProfile.timings?.length === 2) setTimings([dayjs(myProfile.timings[0], "HH:mm"), dayjs(myProfile.timings[1], "HH:mm")]);
          }
        }
      } catch (e) {
        message.error("Failed to load settings.");
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  const setAccountField = (k, v) => setAccount((p) => ({ ...p, [k]: v }));
  const onSaveAccount = async () => {
    try {
      setSavingAccount(true);
      await axiosInstance.post("/api/user/updateprofile", account, { headers: authHeader() });
      // refresh localStorage
      const stored = JSON.parse(localStorage.getItem("userData") || "{}");
      localStorage.setItem("userData", JSON.stringify({ ...stored, fullName: account.fullName, email: account.email }));
      message.success("Account updated");
    } catch (err) {
      message.error(err.response?.data?.message || "Failed to update account.");
    } finally {
      setSavingAccount(false);
    }
  };

  const setDocField = (k, v) => setDocFields((p) => ({ ...p, [k]: v }));
  const onSaveDoctor = async () => {
    try {
      setSavingDoctor(true);
      await axiosInstance.post("/api/doctor/updateprofile", {
        ...docFields,
        fees: Number(docFields.fees),
        timings: timings ? [timings[0].format("HH:mm"), timings[1].format("HH:mm")] : undefined,
      }, { headers: authHeader() });
      message.success("Doctor profile updated");
    } catch (err) {
      message.error(err.response?.data?.message || "Failed to update doctor profile.");
    } finally {
      setSavingDoctor(false);
    }
  };

  const onDeleteAccount = () => {
    Modal.confirm({
      title: "Delete account",
      content: "This will permanently delete your account, appointments and documents. This action cannot be undone.",
      okText: "Delete",
      okType: "danger",
      cancelText: "Cancel",
      onOk: async () => {
        try {
          await axiosInstance.post("/api/user/deleteaccount", {}, { headers: authHeader() });
          localStorage.clear();
          message.success("Account deleted");
          navigate("/");
        } catch (err) {
          message.error(err.response?.data?.message || "Failed to delete account.");
        }
      },
    });
  };

  if (loading) return <div style={{ padding: "2rem" }}>Loading settings…</div>;

  return (
    <div className="dashboard-layout">
      <Sidebar role={isDoctor ? "doctor" : "user"} navItems={isDoctor ? DOCTOR_NAV : navItems} userName={userData.fullName || ""} notifCount={0} />

      <main className="dashboard-main">
        <header className="dashboard-header">
          <h3>Settings</h3>
        </header>

        <div className="dashboard-content">
          <div style={{ maxWidth: "760px" }}>
            <div className="card-brand animate-fade-up" style={{ padding: "1.75rem", marginBottom: "1rem" }}>
              <h4 style={{ marginTop: 0 }}>Account</h4>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1rem" }}>
                <input value={account.fullName} onChange={(e) => setAccountField("fullName", e.target.value)} placeholder="Full name" style={{ padding: "0.7rem" }} />
                <input value={account.phone} onChange={(e) => setAccountField("phone", e.target.value)} placeholder="Phone" style={{ padding: "0.7rem" }} />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1rem" }}>
                <input value={account.email} onChange={(e) => setAccountField("email", e.target.value)} placeholder="Email" style={{ padding: "0.7rem" }} />
                <input value={account.password} onChange={(e) => setAccountField("password", e.target.value)} placeholder="New password (optional)" type="password" style={{ padding: "0.7rem" }} />
              </div>
              <div style={{ display: "flex", gap: "1rem" }}>
                <button onClick={onSaveAccount} className="btn-brand" disabled={savingAccount}>{savingAccount ? "Saving…" : "Save"}</button>
              </div>
            </div>

            {isDoctor && (
              <div className="card-brand animate-fade-up" style={{ padding: "1.75rem", marginBottom: "1rem" }}>
                <h4 style={{ marginTop: 0 }}>Doctor profile</h4>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                  <input value={docFields.fullName} onChange={(e) => setDocField("fullName", e.target.value)} placeholder="Full name" style={{ padding: "0.7rem" }} />
                  <input value={docFields.phone} onChange={(e) => setDocField("phone", e.target.value)} placeholder="Phone" style={{ padding: "0.7rem" }} />
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginTop: "1rem" }}>
                  <input value={docFields.email} onChange={(e) => setDocField("email", e.target.value)} placeholder="Email" style={{ padding: "0.7rem" }} />
                  <input value={docFields.address} onChange={(e) => setDocField("address", e.target.value)} placeholder="Clinic address" style={{ padding: "0.7rem" }} />
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginTop: "1rem" }}>
                  <input value={docFields.specialisation} onChange={(e) => setDocField("specialisation", e.target.value)} placeholder="Specialisation" style={{ padding: "0.7rem" }} />
                  <input value={docFields.experience} onChange={(e) => setDocField("experience", e.target.value)} placeholder="Experience" style={{ padding: "0.7rem" }} />
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginTop: "1rem" }}>
                  <input value={docFields.fees} onChange={(e) => setDocField("fees", e.target.value)} placeholder="Fees" style={{ padding: "0.7rem" }} />
                  <div>
                    <label style={{ display: "block", marginBottom: "0.4rem" }}>Timings</label>
                    <TimePicker.RangePicker value={timings} onChange={(v) => setTimings(v)} format="HH:mm" />
                  </div>
                </div>
                <div style={{ display: "flex", gap: "1rem", marginTop: "1rem" }}>
                  <button onClick={onSaveDoctor} className="btn-brand" disabled={savingDoctor}>{savingDoctor ? "Saving…" : "Save Doctor Profile"}</button>
                </div>
              </div>
            )}

            <div style={{ marginTop: "1rem" }}>
              <button onClick={onDeleteAccount} className="btn-brand-outline" style={{ background: "none", border: "1px solid rgba(197,100,100,0.35)", color: "#c0392b" }}>
                🗑 Delete account
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
