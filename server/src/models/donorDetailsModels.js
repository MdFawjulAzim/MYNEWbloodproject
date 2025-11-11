const mongoose = require("mongoose");

const donorDetailsSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "users",
      required: true,
      unique: true,
    },
    blood_group: {
      type: String,
      required: true,
      enum: ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"],
    },
    date_of_birth: {
      type: Date,
      required: true,
    },
    last_donation_date: {
      type: Date,
      default: null,
    },
    gender: {
      type: String,
      enum: ["Male", "Female"],
      required: true,
    },
    district: {
      type: String,
      required: true,
      trim: true,
    },
    upazila: {
      type: String,
      required: true,
      trim: true,
    },
    is_available: {
      type: Boolean,
      default: true,
    },
    // Soft delete
    is_deleted: {
      type: Boolean,
      default: false,
      index: true,
    },
    deleted_at: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true, versionKey: false }
);

donorDetailsSchema.index({ user_id: 1, is_deleted: 1 });

const donorDetailsModel = mongoose.model("donor_details", donorDetailsSchema);
module.exports = donorDetailsModel;
