const donorDetailsModel = require("../models/donorDetailsModels");
const userModel = require("../models/userModels");

const assertDonorRole = async (userId) => {
  const user = await userModel.findById(userId, { role: 1 });
  if (!user) return { ok: false, message: "User not found" };
  if (user.role !== "donor" && user.role !== "admin")
    return { ok: false, message: "Only donors can manage donor details" };
  return { ok: true, user };
};

const createDonorDetailsService = async (req) => {
  try {
    const userId = req.user.id;
    const roleCheck = await assertDonorRole(userId);
    if (!roleCheck.ok) return { status: "fail", message: roleCheck.message };

    const {
      blood_group,
      date_of_birth,
      last_donation_date,
      gender,
      district,
      upazila,
      is_available,
    } = req.body;

    if (!blood_group || !date_of_birth || !gender || !district || !upazila) {
      return {
        status: "fail",
        message:
          "blood_group, date_of_birth, gender, district, upazila are required",
      };
    }

    const exists = await donorDetailsModel.findOne(
      { user_id: userId, is_deleted: false },
      { _id: 1 }
    );
    if (exists) {
      return { status: "fail", message: "Donor details already exist" };
    }

    const data = await donorDetailsModel.create({
      user_id: userId,
      blood_group,
      date_of_birth,
      last_donation_date: last_donation_date || null,
      gender,
      district,
      upazila,
      is_available: typeof is_available === "boolean" ? is_available : true,
    });

    return { status: "success", message: "Donor details created", data };
  } catch (err) {
    if (err.name === "ValidationError") {
      const errors = Object.values(err.errors).map((e) => e.message);
      return { status: "fail", message: errors.join(", ") };
    }
    return {
      status: "fail",
      message: `Unable to create donor details: ${err.message}`,
    };
  }
};

const getMyDonorDetailsService = async (req) => {
  try {
    const userId = req.user.id;
    const data = await donorDetailsModel.findOne({
      user_id: userId,
      is_deleted: false,
    });
    if (!data) return { status: "fail", message: "Donor details not found" };
    return { status: "success", data };
  } catch (err) {
    return {
      status: "fail",
      message: `Unable to fetch donor details: ${err.message}`,
    };
  }
};

const getDonorDetailsByIdService = async (req) => {
  try {
    const { id } = req.params;
    const data = await donorDetailsModel.findOne({
      _id: id,
      is_deleted: false,
    });
    if (!data) return { status: "fail", message: "Donor details not found" };
    return { status: "success", data };
  } catch (err) {
    return {
      status: "fail",
      message: `Unable to fetch donor details: ${err.message}`,
    };
  }
};

const updateMyDonorDetailsService = async (req) => {
  try {
    const userId = req.user.id;
    const roleCheck = await assertDonorRole(userId);
    if (!roleCheck.ok) return { status: "fail", message: roleCheck.message };

    const updatable = [
      "blood_group",
      "date_of_birth",
      "last_donation_date",
      "gender",
      "district",
      "upazila",
      "is_available",
    ];
    const updates = {};
    for (const k of updatable) {
      if (k in req.body) updates[k] = req.body[k];
    }
    if (Object.keys(updates).length === 0) {
      return { status: "fail", message: "No fields to update" };
    }

    const data = await donorDetailsModel.findOneAndUpdate(
      { user_id: userId, is_deleted: false },
      { $set: updates },
      { new: true }
    );
    if (!data) return { status: "fail", message: "Donor details not found" };
    return { status: "success", message: "Donor details updated", data };
  } catch (err) {
    if (err.name === "ValidationError") {
      const errors = Object.values(err.errors).map((e) => e.message);
      return { status: "fail", message: errors.join(", ") };
    }
    return {
      status: "fail",
      message: `Unable to update donor details: ${err.message}`,
    };
  }
};

const softDeleteMyDonorDetailsService = async (req) => {
  try {
    const userId = req.user.id;
    const data = await donorDetailsModel.findOneAndUpdate(
      { user_id: userId, is_deleted: false },
      { $set: { is_deleted: true, deleted_at: new Date() } },
      { new: true }
    );
    if (!data) return { status: "fail", message: "Donor details not found" };
    return { status: "success", message: "Donor details soft-deleted" };
  } catch (err) {
    return {
      status: "fail",
      message: `Unable to delete donor details: ${err.message}`,
    };
  }
};

module.exports = {
  createDonorDetailsService,
  getMyDonorDetailsService,
  getDonorDetailsByIdService,
  updateMyDonorDetailsService,
  softDeleteMyDonorDetailsService,
};
