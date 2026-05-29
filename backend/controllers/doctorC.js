const path            = require("path");
const fs              = require("fs");
const userModel       = require("../schemas/userModel");
const docModel        = require("../schemas/docModel");
const appointmentModel= require("../schemas/appointmentModel");

// ─────────────────────────────────────────────────────────────────
// POST /api/doctor/updateprofile
// Body: editable doctor profile fields
// Finds the doctor profile linked to req.body.userId (from JWT),
// then updates all provided fields.
// §9 fix: typo "allApointments" → "allAppointments" kept clean
//         throughout this file.
// ─────────────────────────────────────────────────────────────────
const updateDoctorProfileController = async (req, res) => {
  try {
    const {
      userId,
      fullName, email, phone, address,
      specialisation, experience, fees, timings,
    } = req.body;

    if (
      !fullName || !email || !phone || !address ||
      !specialisation || !experience || !fees || !timings
    ) {
      return res
        .status(400)
        .json({ message: "All profile fields are required" });
    }

    const doctor = await docModel.findOne({ userId });
    if (!doctor) {
      return res
        .status(404)
        .json({ message: "Doctor profile not found for this user" });
    }

    await docModel.findOneAndUpdate(
      { userId },
      { fullName, email, phone, address, specialisation, experience, fees, timings },
      { new: true }
    );

    return res
      .status(200)
      .json({ message: "Doctor profile updated successfully" });
  } catch (err) {
    return res
      .status(500)
      .json({ message: "Failed to update profile", error: err.message });
  }
};

// ─────────────────────────────────────────────────────────────────
// GET /api/doctor/getdoctorappointments
// Returns all appointments belonging to the logged-in doctor.
// Looks up the doctor profile by userId, then queries appointments
// by doctorInfo === doctor._id.
// ─────────────────────────────────────────────────────────────────
const getAllDoctorAppointmentsController = async (req, res) => {
  try {
    const doctor = await docModel.findOne({ userId: req.body.userId });
    if (!doctor) {
      return res
        .status(404)
        .json({ message: "Doctor profile not found for this user" });
    }

    const allAppointments = await appointmentModel.find({
      doctorInfo: doctor._id,
    });

    return res.status(200).json({ data: allAppointments });
  } catch (err) {
    return res
      .status(500)
      .json({ message: "Failed to fetch appointments", error: err.message });
  }
};

// ─────────────────────────────────────────────────────────────────
// POST /api/doctor/handlestatus
// Body: { appointmentId, status }   status: "approved" | "rejected"
// Updates appointment status, then notifies the patient.
// ─────────────────────────────────────────────────────────────────
const handleStatusController = async (req, res) => {
  try {
    const { appointmentId, status } = req.body;

    if (!appointmentId || !status) {
      return res
        .status(400)
        .json({ message: "appointmentId and status are required" });
    }

    const validStatuses = ["approved", "rejected"];
    if (!validStatuses.includes(status)) {
      return res
        .status(400)
        .json({ message: "status must be 'approved' or 'rejected'" });
    }

    const appointment = await appointmentModel.findById(appointmentId);
    if (!appointment) {
      return res.status(404).json({ message: "Appointment not found" });
    }

    await appointmentModel.findByIdAndUpdate(appointmentId, { status });

    // Notify the patient
    await userModel.findByIdAndUpdate(appointment.userInfo, {
      $push: {
        notification: {
          type:        `appointment-${status}`,
          message:     `Your appointment on ${appointment.date} has been ${status}`,
          onClickPath: "/user/appointments",
        },
      },
    });

    return res
      .status(200)
      .json({ message: `Appointment ${status} successfully` });
  } catch (err) {
    return res
      .status(500)
      .json({ message: "Failed to update appointment status", error: err.message });
  }
};

// ─────────────────────────────────────────────────────────────────
// GET /api/doctor/getdocumentdownload?appointId=<id>
// Streams the patient document attached to an appointment.
// Returns 400 if appointId is missing, 404 if appointment or file
// is not found, 409 if the appointment has no document attached.
// ─────────────────────────────────────────────────────────────────
const documentDownloadController = async (req, res) => {
  try {
    const { appointId } = req.query;

    if (!appointId) {
      return res.status(400).json({ message: "appointId query parameter is required" });
    }

    const appointment = await appointmentModel.findById(appointId);
    if (!appointment) {
      return res.status(404).json({ message: "Appointment not found" });
    }

    if (!appointment.document || !appointment.document.path) {
      return res
        .status(409)
        .json({ message: "No document attached to this appointment" });
    }

    // Resolve the stored document path robustly. The appointment may store
    // a relative path like "uploads/12345-file.pdf" or an absolute path.
    let filePath = null;
    const docPath = appointment.document.path;

    if (path.isAbsolute(docPath)) {
      filePath = docPath;
    } else {
      // Try resolving relative to backend root
      const candidate = path.join(__dirname, "..", docPath);
      if (fs.existsSync(candidate)) filePath = candidate;
      else {
        // Fallback: search uploads/ for a filename that ends with the basename
        const uploadsDir = path.join(__dirname, "..", "uploads");
        const base = path.basename(docPath);
        try {
          const files = fs.readdirSync(uploadsDir);
          const match = files.find((f) => f.endsWith(base));
          if (match) filePath = path.join(uploadsDir, match);
        } catch (e) {
          // ignore
        }

        // Final fallback: try path.resolve
        if (!filePath) {
          const resolved = path.resolve(docPath);
          if (fs.existsSync(resolved)) filePath = resolved;
        }
      }
    }

    if (!filePath || !fs.existsSync(filePath)) {
      try {
        const attempted = [];
        if (docPath) attempted.push(docPath);
        const candidate = path.join(__dirname, "..", docPath);
        attempted.push(candidate);
        const uploadsDir = path.join(__dirname, "..", "uploads");
        attempted.push(uploadsDir);
        const resolved = path.resolve(docPath);
        attempted.push(resolved);
        console.error(`[doctorDocumentDownload] appointId=${appointId} docPath=${docPath} attempted=${JSON.stringify(attempted)}`);
      } catch (e) {
        // ignore logging errors
      }
      return res
        .status(404)
        .json({ message: "Document file not found on server" });
    }

    return res.download(filePath);
  } catch (err) {
    return res
      .status(500)
      .json({ message: "Failed to download document", error: err.message });
  }
};

module.exports = {
  updateDoctorProfileController,
  getAllDoctorAppointmentsController,
  handleStatusController,
  documentDownloadController,
};
