const bcrypt          = require("bcrypt");
const jwt             = require("jsonwebtoken");
const userModel       = require("../schemas/userModel");
const docModel        = require("../schemas/docModel");
const appointmentModel= require("../schemas/appointmentModel");

// ─────────────────────────────────────────────────────────────────
// PUBLIC
// ─────────────────────────────────────────────────────────────────

const registerController = async (req, res) => {
  try {
    const { fullName, email, password, phone } = req.body;

    if (!fullName || !email || !password || !phone) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const existing = await userModel.findOne({
      email: email.toLowerCase().trim(),
    });
    if (existing) {
      return res.status(409).json({ message: "Email already registered" });
    }

    const hashed = await bcrypt.hash(password, 10);

    // type is ALWAYS "user" — never trust client-supplied role.
    // Admins are created exclusively by existing admins via POST /api/admin/createuser.
    await userModel.create({ fullName, email, password: hashed, phone, type: "user" });

    return res.status(201).json({ message: "User registered successfully" });
  } catch (err) {
    return res
      .status(500)
      .json({ message: "Registration failed", error: err.message });
  }
};

const loginController = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Email and password are required" });
    }

    const user = await userModel.findOne({
      email: email.toLowerCase().trim(),
    });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign({ userId: user._id }, process.env.JWT_KEY);

    return res.status(200).json({
      message: "Login successful",
      token,
      userData: {
        _id:      user._id,
        fullName: user.fullName,
        email:    user.email,
        type:     user.type,
        isdoctor: user.isdoctor,
      },
    });
  } catch (err) {
    return res
      .status(500)
      .json({ message: "Login failed", error: err.message });
  }
};

// ─────────────────────────────────────────────────────────────────
// PROTECTED
// ─────────────────────────────────────────────────────────────────

const authController = async (req, res) => {
  try {
    const user = await userModel
      .findById(req.body.userId)
      .select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.status(200).json({ data: user });
  } catch (err) {
    return res
      .status(500)
      .json({ message: "Failed to fetch user data", error: err.message });
  }
};

const docController = async (req, res) => {
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
        .json({ message: "All doctor fields are required" });
    }

    const existing = await docModel.findOne({ userId });
    if (existing) {
      return res
        .status(409)
        .json({ message: "Doctor application already exists for this user" });
    }

    await docModel.create({
      userId, fullName, email, phone, address,
      specialisation, experience, fees, timings,
      status: "pending",
    });

    // Notify every admin
    const admins = await userModel.find({ type: "admin" });
    const note = {
      type: "doctor-application",
      message: `New doctor application received from ${fullName}`,
      onClickPath: "/admin/doctors",
    };
    await Promise.all(
      admins.map((a) =>
        userModel.findByIdAndUpdate(a._id, { $push: { notification: note } })
      )
    );

    return res
      .status(201)
      .json({ message: "Doctor application submitted successfully" });
  } catch (err) {
    return res
      .status(500)
      .json({ message: "Failed to submit application", error: err.message });
  }
};

const getAllDoctorsControllers = async (req, res) => {
  try {
    const doctors = await docModel.find({ status: "approved" });
    return res.status(200).json({ data: doctors });
  } catch (err) {
    return res
      .status(500)
      .json({ message: "Failed to fetch doctors", error: err.message });
  }
};

const appointmentController = async (req, res) => {
  try {
    /*
     * FormData sends ObjectId references as JSON strings — parse defensively.
     * Security: always use the authenticated user id (injected by authMiddleware)
     * as the booking `userInfo` to prevent clients from creating appointments
     * on behalf of other users. Fall back to client-supplied userInfo only if
     * authentication data is missing (should not happen for protected routes).
     */
    const authenticatedUserId = req.body.userId;

    const userInfoFromBody =
      typeof req.body.userInfo === "string"
        ? JSON.parse(req.body.userInfo)
        : req.body.userInfo;

    const userInfo = authenticatedUserId || userInfoFromBody;

    const doctorInfo =
      typeof req.body.doctorInfo === "string"
        ? JSON.parse(req.body.doctorInfo)
        : req.body.doctorInfo;

    const { date } = req.body;

    if (!userInfo || !doctorInfo || !date) {
      return res
        .status(400)
        .json({ message: "userInfo, doctorInfo, and date are required" });
    }

    const doctor = await docModel.findById(doctorInfo);
    if (!doctor) {
      return res.status(404).json({ message: "Doctor not found" });
    }

    // Save appointment; persist document info and also record the
    // uploaded file in the user's `documents` array so it appears on
    // the Documents page.
    const storedPath = req.file ? `uploads/${req.file.filename}` : undefined;

    if (req.file) {
      try {
        console.log(`[upload] user=${userInfo} file=${req.file.filename} storedPath=${storedPath}`);
      } catch (e) {
        // ignore logging errors
      }
    }

    const created = await appointmentModel.create({
      userInfo,
      doctorInfo,
      date,
      document: storedPath ? { path: storedPath, name: req.file.originalname } : undefined,
      status: "pending",
    });

    if (req.file) {
      try {
        await userModel.findByIdAndUpdate(created.userInfo, {
          $push: { documents: { name: req.file.originalname, path: storedPath } },
        });
      } catch (e) {
        console.error("Failed to attach uploaded document to user record:", e.message);
      }
    }

    // Notify the doctor's linked user account
    await userModel.findByIdAndUpdate(doctor.userId, {
      $push: {
        notification: {
          type: "new-appointment",
          message: `New appointment request for ${date}`,
          onClickPath: "/doctor/appointments",
        },
      },
    });

    return res
      .status(201)
      .json({ message: "Appointment booked successfully" });
  } catch (err) {
    return res
      .status(500)
      .json({ message: "Failed to book appointment", error: err.message });
  }
};

const getallnotificationController = async (req, res) => {
  try {
    const user = await userModel.findById(req.body.userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    await userModel.findByIdAndUpdate(req.body.userId, {
      $push: { seennotification: { $each: user.notification } },
      $set:  { notification: [] },
    });

    return res
      .status(200)
      .json({ message: "All notifications marked as read" });
  } catch (err) {
    return res
      .status(500)
      .json({ message: "Failed to update notifications", error: err.message });
  }
};

const deleteallnotificationController = async (req, res) => {
  try {
    const user = await userModel.findById(req.body.userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    await userModel.findByIdAndUpdate(req.body.userId, {
      $set: { notification: [], seennotification: [] },
    });

    return res.status(200).json({ message: "All notifications deleted" });
  } catch (err) {
    return res
      .status(500)
      .json({ message: "Failed to delete notifications", error: err.message });
  }
};

const getAllUserAppointments = async (req, res) => {
  try {
    const appointments = await appointmentModel.find({
      userInfo: req.body.userId,
    });
    return res.status(200).json({ data: appointments });
  } catch (err) {
    return res
      .status(500)
      .json({ message: "Failed to fetch appointments", error: err.message });
  }
};

const getDocsController = async (req, res) => {
  try {
    const user = await userModel
      .findById(req.body.userId)
      .select("documents");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.status(200).json({ data: user.documents });
  } catch (err) {
    return res
      .status(500)
      .json({ message: "Failed to fetch documents", error: err.message });
  }
};

// GET /api/user/getdocumentdownload?path=<path>&name=<name>
// Streams a document belonging to the authenticated user. Verifies that
// the requested document is present in the user's `documents` array
// before returning the file to prevent arbitrary file access.
const userDocumentDownloadController = async (req, res) => {
  try {
    const { path: docPath, name } = req.query;

    if (!docPath && !name) {
      return res.status(400).json({ message: "path or name query parameter is required" });
    }

    const user = await userModel.findById(req.body.userId).select("documents");
    if (!user) return res.status(404).json({ message: "User not found" });

    const found = user.documents.find((d) => (docPath && d.path === docPath) || (name && d.name === name));
    if (!found) return res.status(404).json({ message: "Document not found for this user" });

    const fs = require("fs");
    const path = require("path");

    const requestedPath = found.path || docPath;
    let filePath = null;
    const attempted = [];

    if (path.isAbsolute(requestedPath)) {
      attempted.push(requestedPath);
      filePath = requestedPath;
    } else {
      const candidate = path.join(__dirname, "..", requestedPath);
      attempted.push(candidate);
      if (fs.existsSync(candidate)) filePath = candidate;
      else {
        const uploadsDir = path.join(__dirname, "..", "uploads");
        attempted.push(uploadsDir);
        const base = path.basename(requestedPath);
        try {
          const files = fs.readdirSync(uploadsDir);
          const match = files.find((f) => f.endsWith(base));
          if (match) {
            const matchPath = path.join(uploadsDir, match);
            attempted.push(matchPath);
            filePath = matchPath;
          }
        } catch (e) {
          // ignore
        }

        if (!filePath) {
          const resolved = path.resolve(requestedPath);
          attempted.push(resolved);
          if (fs.existsSync(resolved)) filePath = resolved;
        }
      }
    }

    if (!filePath || !fs.existsSync(filePath)) {
      console.error(`[userDocumentDownload] user=${req.body.userId} docPath=${docPath} requestedPath=${requestedPath} attempted=${JSON.stringify(attempted)} foundInUser=${!!found}`);
      return res.status(404).json({ message: "Document file not found on server" });
    }

    return res.download(filePath, found.name || name);
  } catch (err) {
    return res.status(500).json({ message: "Failed to download document", error: err.message });
  }
};

const updateUserController = async (req, res) => {
  try {
    const userId = req.body.userId;
    const { fullName, email, phone, password } = req.body;

    const update = {};
    if (fullName) update.fullName = fullName;
    if (email) {
      const existing = await userModel.findOne({ email: email.toLowerCase().trim(), _id: { $ne: userId } });
      if (existing) return res.status(409).json({ message: "Email already in use" });
      update.email = email.toLowerCase().trim();
    }
    if (phone) update.phone = phone;
    if (password) update.password = await bcrypt.hash(password, 10);

    const updated = await userModel.findByIdAndUpdate(userId, update, { new: true }).select("-password");
    return res.status(200).json({ message: "Profile updated", data: updated });
  } catch (err) {
    return res.status(500).json({ message: "Failed to update profile", error: err.message });
  }
};

const deleteUserController = async (req, res) => {
  try {
    const userId = req.body.userId;
    const user = await userModel.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    const fs = require("fs");
    const path = require("path");
    const uploadsDir = path.join(__dirname, "..", "uploads");

    // Delete user's uploaded documents
    if (Array.isArray(user.documents)) {
      for (const d of user.documents) {
        if (!d || !d.path) continue;
        try {
          const candidate = d.path.startsWith("/") ? path.join(__dirname, "..", d.path) : path.join(uploadsDir, path.basename(d.path));
          if (fs.existsSync(candidate)) fs.unlinkSync(candidate);
          else {
            const files = fs.readdirSync(uploadsDir);
            const match = files.find((f) => f.endsWith(path.basename(d.path)));
            if (match) fs.unlinkSync(path.join(uploadsDir, match));
          }
        } catch (e) {
          console.error("Failed to delete user document file:", e.message);
        }
      }
    }

    // Delete appointments where user is the patient
    const appts = await appointmentModel.find({ userInfo: userId });
    for (const appt of appts) {
      if (appt.document && appt.document.path) {
        try {
          const candidate = appt.document.path.startsWith("/") ? path.join(__dirname, "..", appt.document.path) : path.join(uploadsDir, path.basename(appt.document.path));
          if (fs.existsSync(candidate)) fs.unlinkSync(candidate);
          else {
            const files = fs.readdirSync(uploadsDir);
            const match = files.find((f) => f.endsWith(path.basename(appt.document.path)));
            if (match) fs.unlinkSync(path.join(uploadsDir, match));
          }
        } catch (e) {
          console.error("Failed to delete appointment file:", e.message);
        }
      }
      await appointmentModel.findByIdAndDelete(appt._id);
    }

    // If user is a doctor, remove their doctor profile and related appointments
    const docProfile = await docModel.findOne({ userId });
    if (docProfile) {
      const docAppts = await appointmentModel.find({ doctorInfo: docProfile._id });
      for (const appt of docAppts) {
        if (appt.document && appt.document.path) {
          try {
            const candidate = appt.document.path.startsWith("/") ? path.join(__dirname, "..", appt.document.path) : path.join(uploadsDir, path.basename(appt.document.path));
            if (fs.existsSync(candidate)) fs.unlinkSync(candidate);
            else {
              const files = fs.readdirSync(uploadsDir);
              const match = files.find((f) => f.endsWith(path.basename(appt.document.path)));
              if (match) fs.unlinkSync(path.join(uploadsDir, match));
            }
          } catch (e) {
            console.error("Failed to delete doctor appointment file:", e.message);
          }
        }
        await appointmentModel.findByIdAndDelete(appt._id);
      }
      await docModel.findByIdAndDelete(docProfile._id);
    }

    // Finally remove the user record
    await userModel.findByIdAndDelete(userId);

    return res.status(200).json({ message: "Account deleted" });
  } catch (err) {
    return res.status(500).json({ message: "Failed to delete account", error: err.message });
  }
};

const deleteAppointmentController = async (req, res) => {
  try {
    const { appointmentId } = req.body;
    if (!appointmentId) return res.status(400).json({ message: "appointmentId is required" });

    const appt = await appointmentModel.findById(appointmentId);
    if (!appt) return res.status(404).json({ message: "Appointment not found" });

    // Allow deletion by the appointment owner OR the linked doctor account
    let allowed = false;
    if (appt.userInfo.toString() === req.body.userId.toString()) allowed = true;
    else {
      const doc = await docModel.findById(appt.doctorInfo);
      if (doc && doc.userId && doc.userId.toString() === req.body.userId.toString()) allowed = true;
    }
    if (!allowed) {
      return res.status(403).json({ message: "Not authorized to delete this appointment" });
    }

    // Remove attached file if present. Try exact path first, otherwise
    // attempt to locate a file in the uploads folder that ends with the
    // original basename (handles timestamp-prefixed filenames).
    if (appt.document && appt.document.path) {
      const fs = require("fs");
      const path = require("path");
      try {
        const candidate = appt.document.path.startsWith("/")
          ? path.join(__dirname, "..", appt.document.path)
          : path.join(__dirname, "..", "uploads", path.basename(appt.document.path));

        if (fs.existsSync(candidate)) {
          fs.unlinkSync(candidate);
        } else {
          // Fallback: search uploads for a file that ends with the basename
          const uploadsDir = path.join(__dirname, "..", "uploads");
          const base = path.basename(appt.document.path);
          try {
            const files = fs.readdirSync(uploadsDir);
            const match = files.find((f) => f.endsWith(base));
            if (match) fs.unlinkSync(path.join(uploadsDir, match));
          } catch (e) {
            // ignore
          }
        }
      } catch (e) {
        console.error("Failed to delete appointment file:", e.message);
      }
    }

    await appointmentModel.findByIdAndDelete(appointmentId);

    return res.status(200).json({ message: "Appointment deleted" });
  } catch (err) {
    return res.status(500).json({ message: "Failed to delete appointment", error: err.message });
  }
};

const deleteDocumentController = async (req, res) => {
  try {
    const { path: docPath, name } = req.body;
    if (!docPath && !name) return res.status(400).json({ message: "path or name is required" });

    const user = await userModel.findById(req.body.userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    // Remove from user's documents array
    const pullQuery = docPath ? { path: docPath } : { name };
    await userModel.findByIdAndUpdate(req.body.userId, { $pull: { documents: pullQuery } });

    // Attempt to delete file from disk if path provided. If file does not
    // exist at the provided path (e.g. because uploaded files are prefixed
    // with timestamps), try to find a matching file in uploads/ that ends
    // with the original basename.
    if (docPath) {
      const fs = require("fs");
      const path = require("path");
      try {
        const candidate = docPath.startsWith("/") ? path.join(__dirname, "..", docPath) : path.join(__dirname, "..", "uploads", path.basename(docPath));
        if (fs.existsSync(candidate)) {
          fs.unlinkSync(candidate);
        } else {
          const uploadsDir = path.join(__dirname, "..", "uploads");
          const base = path.basename(docPath);
          try {
            const files = fs.readdirSync(uploadsDir);
            const match = files.find((f) => f.endsWith(base));
            if (match) fs.unlinkSync(path.join(uploadsDir, match));
          } catch (e) {
            // ignore
          }
        }
      } catch (e) {
        console.error("Failed to delete document file:", e.message);
      }
    }

    return res.status(200).json({ message: "Document deleted" });
  } catch (err) {
    return res.status(500).json({ message: "Failed to delete document", error: err.message });
  }
};

module.exports = {
  registerController,
  loginController,
  authController,
  docController,
  getAllDoctorsControllers,
  appointmentController,
  getallnotificationController,
  deleteallnotificationController,
  getAllUserAppointments,
  getDocsController,
  deleteAppointmentController,
  deleteDocumentController,
  userDocumentDownloadController,
  updateUserController,
  deleteUserController,
};
