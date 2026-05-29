const express        = require("express");
const authMiddleware = require("../middlewares/authMiddleware");
const {
  createUserController,
  getAllUsersControllers,
  getAllDoctorsControllers,
  getStatusApproveController,
  getStatusRejectController,
  displayAllAppointmentController,
} = require("../controllers/adminC");

const router = express.Router();

// All admin routes require a valid JWT — no public endpoints here
router.post("/createuser",             authMiddleware, createUserController);
router.get( "/getallusers",            authMiddleware, getAllUsersControllers);
router.get( "/getalldoctors",          authMiddleware, getAllDoctorsControllers);
router.post("/getapprove",             authMiddleware, getStatusApproveController);
router.post("/getreject",              authMiddleware, getStatusRejectController);
router.get( "/getallAppointmentsAdmin",authMiddleware, displayAllAppointmentController);

module.exports = router;
