const bcrypt = require("bcrypt");
const userModel        = require("../schemas/userModel");
const docModel         = require("../schemas/docModel");
const appointmentModel = require("../schemas/appointmentModel");

// ─────────────────────────────────────────────────────────────────
// POST /api/admin/createuser
// Body: { fullName, email, password, phone, type }
// Only admins can create accounts with type "admin".
// Regular registration always produces type "user".
// ─────────────────────────────────────────────────────────────────
const createUserController = async (req, res) => {
  try {
    const { fullName, email, password, phone, type } = req.body;

    if (!fullName || !email || !password || !phone || !type) {
      return res.status(400).json({ message: "All fields are required" });
    }

    if (!["user", "admin"].includes(type)) {
      return res.status(400).json({ message: "type must be 'user' or 'admin'" });
    }

    // Verify the requesting user is actually an admin
    const requestingUser = await userModel.findById(req.body.userId);
    if (!requestingUser || requestingUser.type !== "admin") {
      return res.status(403).json({ message: "Only admins can create user accounts" });
    }

    const existing = await userModel.findOne({ email: email.toLowerCase().trim() });
    if (existing) {
      return res.status(409).json({ message: "Email already registered" });
    }

    const hashed = await bcrypt.hash(password, 10);
    await userModel.create({ fullName, email, password: hashed, phone, type });

    return res.status(201).json({ message: `${type === "admin" ? "Admin" : "User"} account created successfully` });
  } catch (err) {
    return res
      .status(500)
      .json({ message: "Failed to create user", error: err.message });
  }
};

// ─────────────────────────────────────────────────────────────────
// GET /api/admin/getallusers
// ─────────────────────────────────────────────────────────────────
const getAllUsersControllers = async (req, res) => {
  try {
    const users = await userModel.find({}).select("-password");
    return res.status(200).json({ data: users });
  } catch (err) {
    return res
      .status(500)
      .json({ message: "Failed to fetch users", error: err.message });
  }
};

// ─────────────────────────────────────────────────────────────────
// GET /api/admin/getalldoctors
// Returns ALL doctor profiles (pending, approved, rejected).
// §9 fix: source had a space in function name — fixed.
// ─────────────────────────────────────────────────────────────────
const getAllDoctorsControllers = async (req, res) => {
  try {
    const doctors = await docModel.find({});
    return res.status(200).json({ data: doctors });
  } catch (err) {
    return res
      .status(500)
      .json({ message: "Failed to fetch doctors", error: err.message });
  }
};

// ─────────────────────────────────────────────────────────────────
// POST /api/admin/getapprove
// Body: { doctorId, userid }
// 1. Sets doctor.status → "approved"
// 2. Sets user.isdoctor → true
// 3. Notifies the doctor's user account
// ─────────────────────────────────────────────────────────────────
const getStatusApproveController = async (req, res) => {
  try {
    const { doctorId, userid } = req.body;

    if (!doctorId || !userid) {
      return res
        .status(400)
        .json({ message: "doctorId and userid are required" });
    }

    const doctor = await docModel.findById(doctorId);
    if (!doctor) {
      return res.status(404).json({ message: "Doctor not found" });
    }

    const user = await userModel.findById(userid);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    await docModel.findByIdAndUpdate(doctorId, { status: "approved" });

    await userModel.findByIdAndUpdate(userid, {
      isdoctor: true,
      $push: {
        notification: {
          type:        "doctor-account-approved",
          message:     "Your doctor application has been approved",
          onClickPath: "/doctor/profile",
        },
      },
    });

    return res
      .status(200)
      .json({ message: "Doctor application approved successfully" });
  } catch (err) {
    return res
      .status(500)
      .json({ message: "Failed to approve doctor", error: err.message });
  }
};

// ─────────────────────────────────────────────────────────────────
// POST /api/admin/getreject
// Body: { doctorId, userid }
// 1. Sets doctor.status → "rejected"
// 2. Sets user.isdoctor → false
// 3. Notifies the doctor's user account
// ─────────────────────────────────────────────────────────────────
const getStatusRejectController = async (req, res) => {
  try {
    const { doctorId, userid } = req.body;

    if (!doctorId || !userid) {
      return res
        .status(400)
        .json({ message: "doctorId and userid are required" });
    }

    const doctor = await docModel.findById(doctorId);
    if (!doctor) {
      return res.status(404).json({ message: "Doctor not found" });
    }

    const user = await userModel.findById(userid);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    await docModel.findByIdAndUpdate(doctorId, { status: "rejected" });

    await userModel.findByIdAndUpdate(userid, {
      isdoctor: false,
      $push: {
        notification: {
          type:        "doctor-account-rejected",
          message:     "Your doctor application has been rejected",
          onClickPath: "/userhome",
        },
      },
    });

    return res
      .status(200)
      .json({ message: "Doctor application rejected successfully" });
  } catch (err) {
    return res
      .status(500)
      .json({ message: "Failed to reject doctor", error: err.message });
  }
};

// ─────────────────────────────────────────────────────────────────
// GET /api/admin/getallAppointmentsAdmin
// Returns every appointment in the system.
// ─────────────────────────────────────────────────────────────────
const displayAllAppointmentController = async (req, res) => {
  try {
    const appointments = await appointmentModel.find({});
    return res.status(200).json({ data: appointments });
  } catch (err) {
    return res
      .status(500)
      .json({ message: "Failed to fetch appointments", error: err.message });
  }
};

module.exports = {
  createUserController,
  getAllUsersControllers,
  getAllDoctorsControllers,
  getStatusApproveController,
  getStatusRejectController,
  displayAllAppointmentController,
};
