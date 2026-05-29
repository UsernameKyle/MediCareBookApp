const express        = require("express");
const authMiddleware = require("../middlewares/authMiddleware");
const {
  updateDoctorProfileController,
  getAllDoctorAppointmentsController,
  handleStatusController,
  documentDownloadController,
} = require("../controllers/doctorC");

const router = express.Router();

// All doctor routes require a valid JWT
router.post("/updateprofile",          authMiddleware, updateDoctorProfileController);
router.get( "/getdoctorappointments",  authMiddleware, getAllDoctorAppointmentsController);
router.post("/handlestatus",           authMiddleware, handleStatusController);
router.get( "/getdocumentdownload",    authMiddleware, documentDownloadController);

module.exports = router;
