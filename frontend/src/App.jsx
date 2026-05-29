import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

// Common
import Home         from "./components/common/Home.jsx";
import Login        from "./components/common/Login.jsx";
import Register     from "./components/common/Register.jsx";
import Notification from "./components/common/Notification.jsx";
import Settings from "./components/common/Settings.jsx";

// User portal
import UserHome        from "./components/user/UserHome.jsx";
import DoctorList      from "./components/user/DoctorList.jsx";
import UserAppointment from "./components/user/UserAppointment.jsx";
import ApplyDoctor     from "./components/user/ApplyDoctor.jsx";
import AddDocs         from "./components/user/AddDocs.jsx";

// Doctor portal
import DoctorHome         from "./components/doctor/DoctorHome.jsx";
import DoctorAppointments from "./components/doctor/DoctorAppointments.jsx";
import DoctorProfile      from "./components/doctor/DoctorProfile.jsx";

// Admin portal
import AdminHome        from "./components/admin/AdminHome.jsx";
import AdminUsers       from "./components/admin/AdminUsers.jsx";
import AdminDoctors     from "./components/admin/AdminDoctors.jsx";
import AdminAppointment from "./components/admin/AdminAppointment.jsx";

// ─── Route guards ─────────────────────────────────────────────────

/** Requires login. adminOnly and doctorOnly restrict further. */
const PrivateRoute = ({ children, adminOnly = false, doctorOnly = false }) => {
  const token    = localStorage.getItem("token");
  const userData = JSON.parse(localStorage.getItem("userData") || "null");

  if (!token || !userData) return <Navigate to="/login" replace />;
  if (adminOnly  && userData.type !== "admin") return <Navigate to="/userhome" replace />;
  if (doctorOnly && !userData.isdoctor)        return <Navigate to="/userhome" replace />;
  return children;
};

/** Redirects logged-in users away from login/register. */
const PublicOnlyRoute = ({ children }) => {
  const token    = localStorage.getItem("token");
  const userData = JSON.parse(localStorage.getItem("userData") || "null");
  if (token && userData) return <Navigate to={homePath(userData)} replace />;
  return children;
};

/** Returns the correct home path based on role. */
const homePath = (userData) => {
  if (!userData) return "/login";
  if (userData.type === "admin")   return "/adminhome";
  if (userData.isdoctor === true)  return "/doctorhome";
  return "/userhome";
};

/**
 * SmartCatchAll — unknown routes send logged-in users to their own
 * dashboard instead of the landing page, so a stale onClickPath
 * never appears to sign the user out.
 */
const SmartCatchAll = () => {
  const token    = localStorage.getItem("token");
  const userData = JSON.parse(localStorage.getItem("userData") || "null");
  if (token && userData) return <Navigate to={homePath(userData)} replace />;
  return <Navigate to="/" replace />;
};

// ─── App ──────────────────────────────────────────────────────────

export default function App() {
  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Routes>

        {/* ── Public ────────────────────────────────────────────── */}
        <Route path="/"         element={<Home />} />
        <Route path="/login"    element={<PublicOnlyRoute><Login /></PublicOnlyRoute>} />
        <Route path="/register" element={<PublicOnlyRoute><Register /></PublicOnlyRoute>} />

        {/* ── Shared — accessible while logged in ───────────────── */}
        <Route path="/notification" element={<PrivateRoute><Notification /></PrivateRoute>} />

        {/* ── User portal ───────────────────────────────────────── */}
        <Route path="/userhome"     element={<PrivateRoute><UserHome /></PrivateRoute>} />
        <Route path="/doctors"      element={<PrivateRoute><DoctorList /></PrivateRoute>} />
        <Route path="/appointments" element={<PrivateRoute><UserAppointment /></PrivateRoute>} />
        <Route path="/applydoctor"  element={<PrivateRoute><ApplyDoctor /></PrivateRoute>} />
        <Route path="/documents"    element={<PrivateRoute><AddDocs /></PrivateRoute>} />
        <Route path="/settings"     element={<PrivateRoute><Settings /></PrivateRoute>} />

        {/* ── Doctor portal ─────────────────────────────────────── */}
        <Route path="/doctorhome"        element={<PrivateRoute doctorOnly><DoctorHome /></PrivateRoute>} />
        <Route path="/doctorapointments" element={<PrivateRoute doctorOnly><DoctorAppointments /></PrivateRoute>} />
        <Route path="/doctorprofile"     element={<PrivateRoute doctorOnly><DoctorProfile /></PrivateRoute>} />

        {/* ── Admin portal ──────────────────────────────────────── */}
        <Route path="/adminhome"    element={<PrivateRoute adminOnly><AdminHome /></PrivateRoute>} />
        <Route path="/adminusers"   element={<PrivateRoute adminOnly><AdminUsers /></PrivateRoute>} />
        <Route path="/admindoctors" element={<PrivateRoute adminOnly><AdminDoctors /></PrivateRoute>} />
        <Route path="/adminappts"   element={<PrivateRoute adminOnly><AdminAppointment /></PrivateRoute>} />

        {/* ── Catch-all ─────────────────────────────────────────── */}
        <Route path="*" element={<SmartCatchAll />} />

      </Routes>
    </BrowserRouter>
  );
}
