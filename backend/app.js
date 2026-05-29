const express      = require("express");
const cors         = require("cors");
const userRoutes   = require("./routes/userRoutes");
const adminRoutes  = require("./routes/adminRoutes");
const doctorRoutes = require("./routes/doctorRoutes");

const createApp = () => {
  const app = express();

  // Ensure uploads directory exists (Multer requires the destination to exist).
  const fs = require("fs");
  const path = require("path");
  const uploadsDir = path.join(__dirname, "uploads");
  try {
    if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir);
  } catch (e) {
    console.error("Failed to ensure uploads directory:", e.message);
  }

  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  app.use("/api/user",   userRoutes);
  app.use("/api/admin",  adminRoutes);
  app.use("/api/doctor", doctorRoutes);

  // Global error handler
  app.use((err, _req, res, _next) => {
    console.error(err.stack);
    res.status(500).json({ message: "Internal server error" });
  });

  return app;
};

module.exports = createApp;
