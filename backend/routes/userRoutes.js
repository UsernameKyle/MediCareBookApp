const express        = require("express");
const multer         = require("multer");
const path           = require("path");
const authMiddleware = require("../middlewares/authMiddleware");
const {
  registerController,
  loginController,
  authController,
  docController,
  getAllDoctorsControllers,
  appointmentController,
  getallnotificationController,
  deleteallnotificationController,
  deleteAppointmentController,
  getAllUserAppointments,
  getDocsController,
  deleteDocumentController,
  userDocumentDownloadController,
} = require("../controllers/userC");

const router = express.Router();

// ── Multer ────────────────────────────────────────────────────────
const storage = multer.diskStorage({
  destination: (_req, _file, cb) =>
    cb(null, path.join(__dirname, "../uploads")),
  filename: (_req, file, cb) =>
    cb(null, `${Date.now()}-${file.originalname.replace(/\s+/g, "_")}`),
});
const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } });

// ── Public ────────────────────────────────────────────────────────
router.post("/register", registerController);
router.post("/login",    loginController);

// ── Protected ─────────────────────────────────────────────────────
router.post("/getuserdata",            authMiddleware, authController);
router.post("/registerdoc",            authMiddleware, docController);
router.get( "/getalldoctorsu",         authMiddleware, getAllDoctorsControllers);
router.post("/getappointment",         authMiddleware, upload.single("document"), appointmentController);
router.post("/getallnotification",     authMiddleware, getallnotificationController);
router.post("/deleteallnotification",  authMiddleware, deleteallnotificationController);
router.post("/deleteappointment",      authMiddleware, deleteAppointmentController);
router.post("/updateprofile",          authMiddleware, require("../controllers/userC").updateUserController);
router.post("/deleteaccount",          authMiddleware, require("../controllers/userC").deleteUserController);
router.get( "/getuserappointments",    authMiddleware, getAllUserAppointments);
router.get( "/getDocsforuser",         authMiddleware, getDocsController);
router.post("/deletedocument",         authMiddleware, deleteDocumentController);
router.get("/getdocumentdownload",     authMiddleware, userDocumentDownloadController);

module.exports = router;
