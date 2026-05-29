const mongoose = require("mongoose");

const connectToDB = async () => {
  try {
    const uri = process.env.MONGO_DB || process.env.MONGO_URI;
    await mongoose.connect(uri);
    console.log("MongoDB connected successfully");
  } catch (err) {
    console.error("MongoDB connection error:", err.message);
    process.exit(1);
  }
};

module.exports = connectToDB;
