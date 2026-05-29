const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: true,
      set: (v) =>
        v
          .trim()
          .toLowerCase()
          .replace(/\b\w/g, (c) => c.toUpperCase()),
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: { type: String, required: true },
    phone:    { type: String, required: true },
    type:     { type: String, enum: ["admin", "user"], default: "user" },
    isdoctor: { type: Boolean, default: false },
    notification:     { type: Array, default: [] },
    seennotification: { type: Array, default: [] },
    documents:        { type: Array, default: [] },
  },
  { timestamps: true }
);

module.exports = mongoose.model("users", userSchema);
