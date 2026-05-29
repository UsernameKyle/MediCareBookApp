/**
 * useUserNav — nav for the USER portal only.
 * Doctors have their own portal (/doctorhome) with separate nav.
 * This hook is used by user-side pages: UserHome, DoctorList,
 * UserAppointment, AddDocs. These pages are accessible to both
 * regular users AND approved doctors (doctors can still book
 * appointments for themselves as patients).
 */
export function useUserNav() {
  const userData = JSON.parse(localStorage.getItem("userData") || "{}");

  const isDoctor = userData?.isdoctor === true;

  const navItems = [
    { label: "Dashboard",       path: "/userhome",    icon: "⚕️" },
    { label: "Find Doctors",    path: "/doctors",      icon: "🔍" },
    { label: "My Appointments", path: "/appointments", icon: "📅" },
    ...(!isDoctor ? [{ label: "Apply as Doctor", path: "/applydoctor", icon: "🩺" }] : []),
    { label: "My Documents",    path: "/documents",    icon: "📄" },
    { label: "Settings",        path: "/settings",     icon: "⚙️" },
  ];

  return { role: "user", navItems, userData };
}
