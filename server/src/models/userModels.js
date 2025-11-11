const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    },
    phone: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      // Keep BD phone format; adjust if needed
      match: /^01[3-9]\d{8}$/,
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
    },
    role: {
      type: String,
      enum: ["admin", "donor", "receiver"],
      default: "donor",
    },
    avatar: {
      type: String,
      default: null,
    },
  },
  { timestamps: true, versionKey: false }
);

const userModel = mongoose.model("users", userSchema);

module.exports = userModel;
