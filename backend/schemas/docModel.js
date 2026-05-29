const mongoose = require("mongoose");

const docSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "users",
      required: true,
    },
    fullName: {
      type: String,
      required: true,
      set: (v) =>
        v
          .trim()
          .toLowerCase()
          .replace(/\b\w/g, (c) => c.toUpperCase()),
    },
    email:         { type: String, required: true, lowercase: true, trim: true },
    phone:         { type: String, required: true },
    address:       { type: String, required: true },
    specialisation:{ type: String, required: true },
    experience:    { type: String, required: true },
    fees:          { type: Number, required: true },
    timings:       { type: Array,  required: true },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("doctors", docSchema);
