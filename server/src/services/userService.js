const userModel = require("../models/userModels");
const profileModel = require("../models/donorDetailsModels");
const bcryptjs = require("bcryptjs");
const { TokenEncode } = require("../utility/tokenHelper");
const EmailSend = require("../utility/EmailHelper");
const mongoose = require("mongoose");

const registrationServices = async (req) => {
  try {
    let { name, email, phone, password, role = "donor", avatar } = req.body;

    if (!name || !email || !phone || !password) {
      return {
        status: "fail",
        message: "name, email, phone and password are required",
      };
    }
    if (!["admin", "donor", "receiver"].includes(role)) {
      return { status: "fail", message: "Invalid role" };
    }

    email = String(email).toLowerCase().trim();
    phone = String(phone).trim();

    // Ensure unique email/phone
    const exists = await userModel.findOne(
      { $or: [{ email }, { phone }] },
      { _id: 1 }
    );
    if (exists) {
      return { status: "fail", message: "Email or phone already exists" };
    }

    const salt = await bcryptjs.genSalt(10);
    const hash = await bcryptjs.hash(password, salt);

    const user = await userModel.create({
      name,
      email,
      phone,
      password: hash,
      role,
      avatar: avatar || null,
    });

    // Auto-login: issue token
    const token = TokenEncode(email || phone, user._id.toString(), user.role);
    return {
      status: "success",
      message: "Registered successfully",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        avatar: user.avatar,
      },
    };
  } catch (e) {
    if (e.code === 11000) {
      return { status: "fail", message: "Email or phone already exists" };
    }
    if (e.name === "ValidationError") {
      const errors = Object.values(e.errors).map((err) => err.message);
      return { status: "fail", message: errors.join(", ") };
    }
    return { status: "fail", message: `Unable to register user: ${e.message}` };
  }
};

const loginServices = async (req) => {
  try {
    const { email, phone, identifier, password } = req.body;

    if (!password) {
      return { status: "fail", message: "password is required" };
    }

    let query = {};
    if (identifier) {
      const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(identifier);
      query = isEmail
        ? { email: identifier.toLowerCase().trim() }
        : { phone: identifier.trim() };
    } else if (email) {
      query = { email: String(email).toLowerCase().trim() };
    } else if (phone) {
      query = { phone: String(phone).trim() };
    } else {
      return {
        status: "fail",
        message: "email or phone (identifier) is required",
      };
    }

    const user = await userModel.findOne(query);
    if (!user) {
      return { status: "fail", message: "User not found" };
    }

    const ok = await bcryptjs.compare(password, user.password);
    if (!ok) {
      return { status: "fail", message: "Incorrect password" };
    }

    const subject = user.email || user.phone;
    const token = TokenEncode(subject, user._id.toString(), user.role);

    return {
      status: "success",
      message: "Successfully login",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        avatar: user.avatar,
      },
    };
  } catch (err) {
    return { status: "fail", message: `Unable to login user: ${err.message}` };
  }
};

const SaveProfileService = async (req, res) => {
  try {
    let user_id = req.headers.user_id;

    // Destructure data from request body
    const {
      location,
      Weight,
      HealthConditions,
      lastDonationTime,
      DonationChek,
    } = req.body;

    // Check for required fields
    if (
      !location ||
      !location.Division ||
      !location.zila ||
      !location.upzila ||
      !location.CurrentAddress
    ) {
      return {
        status: "fail",
        message: "All required fields must be provided",
      };
    }

    // Check if the user exists
    const userExists = await userModel.findById(user_id);
    if (!userExists) {
      return { status: "fail", message: "User not found" };
    }

    // Create and save the profile
    const profileDataPayload = {
      UserID: user_id,
      location: {
        Division: location.Division,
        zila: location.zila,
        upzila: location.upzila,
        CurrentAddress: location.CurrentAddress,
      },
      Weight: Weight || null,
      HealthConditions: HealthConditions || null,
      lastDonationTime: lastDonationTime || null,
      DonationChek: DonationChek,
    };

    const newProfile = await profileModel.findOneAndUpdate(
      { UserID: user_id }, // Filter condition
      profileDataPayload, // Data to insert or update
      { upsert: true, new: true } // Create if not exists, return the new document
    );

    // Return success response
    return {
      status: "success",
      message: "Profile saved successfully",
      data: newProfile,
    };
  } catch (err) {
    // Handle unexpected errors
    return {
      status: "fail",
      message: `Unable to save profile: ${err.message}`,
    };
  }
};

const ProfileDetailsReadServices = async (req, res) => {
  try {
    let user_id = req.headers.user_id;

    let matchStage = { $match: { _id: new mongoose.Types.ObjectId(user_id) } };
    let JoinWithProfileStage = {
      $lookup: {
        from: "profiles", // The collection name of profileModel
        localField: "_id", // Field in userModel
        foreignField: "UserID", // Field in profileModel
        as: "profile", // Alias for the combined data
      },
    };
    let UnwindStage = {
      $unwind: { path: "$profile", preserveNullAndEmptyArrays: true },
    };
    let ProjectionStage = {
      $project: {
        password: 0,
        otp: 0,
        createdAt: 0,
        updatedAt: 0,
        "profile._id": 0,
        "profile.UserID": 0,
        "profile.createdAt": 0,
        "profile.updatedAt": 0,
      },
    };

    let data = await userModel.aggregate([
      matchStage,
      JoinWithProfileStage,
      UnwindStage,
      ProjectionStage,
    ]);

    if (!data.length) {
      return {
        status: "fail",
        message: "User not found or profile data is unavailable",
      };
    }

    return { status: "success", data: data[0] };
  } catch (err) {
    return {
      status: "fail",
      message: `Error fetching user and profile details: ${err.message}`,
    };
  }
};

const GetEmail = async (req, res) => {
  try {
    let email = req.params.email;
    let userId = req.headers.user_id;
    if (email) {
      let user = await userModel.findOne({ Email: email });
      if (user) {
        return { status: "fail", message: "Email already exists" };
      }
      let code = Math.floor(100000 + Math.random() * 900000);
      let EmailText = `your verification code is ${code}`;
      let EmailSubject = "Email Verification";
      await EmailSend(email, EmailText, EmailSubject);
      await userModel.updateOne({ _id: userId }, { $set: { otp: code } });
      return { status: "success", message: "6 digit OTP has been send" };
    }
  } catch (err) {
    return { status: "fail", message: `Email sending failed: ${err.message}` };
  }
};

const verified = async (req, res) => {
  try {
    let email = req.params.email;
    let OTP = req.params.OTP;
    let number = req.headers.numbers;

    // OTP যাচাই করার জন্য ডাটাবেস থেকে ব্যবহারকারী তথ্য অনুসন্ধান করা
    let user = await userModel.findOne({ phoneNumber: number });

    // যদি ব্যবহারকারী না থাকে বা OTP মেল না খায়
    if (!user || user.otp !== OTP) {
      return res
        .status(400)
        .json({ status: "fail", message: "Invalid OTP or OTP expired" });
    } else {
      const random = () => Math.random().toString(36).substring(2, 10) + number;
      // OTP সফলভাবে যাচাই করার পর, OTP শূন্য এবং verify ফিল্ড আপডেট করা
      await userModel.updateOne(
        { phoneNumber: number }, // ব্যবহারকারীর ফোন নম্বর অনুসারে আপডেট
        { $set: { otp: random(), verify: true, Email: email } },

        { upsert: true } // OTP শূন্য করা এবং verify ফিল্ডকে true করা
      );
    }

    // সফল উত্তর প্রদান
    return { status: "success", message: "Valid OTP, verified successfully" };
  } catch (err) {
    // যদি কোন সমস্যা ঘটে তবে এরর বার্তা
    return { status: "fail", message: ` ${err}` };
  }
};

const ProfileUpdateServices = async (req, res) => {
  try {
    let { NIDNumber } = req.body;
    const ExistingUser = await userModel.findOne({ NIDNumber: NIDNumber });
    if (ExistingUser) {
      let {
        NIDNumber,
        firstName,
        lastName,
        Gender,
        DateOfBirth,
        bloodGroup,
        Email,
        password,
      } = req.body;

      let reqBody = {
        ...(firstName && { firstName }),
        ...(lastName && { lastName }),
        // ...(NIDNumber && { NIDNumber }),
        ...(Gender && { Gender }),
        ...(DateOfBirth && { DateOfBirth }),
        ...(bloodGroup && { bloodGroup }),
        ...(Email && { Email }),
      };
      // If password is provided, hash it and add to reqBody
      if (password) {
        const salt = await bcryptjs.genSalt(10);
        const hashPassword = await bcryptjs.hash(password, salt);
        reqBody.password = hashPassword;
      }

      let user_id = req.headers["user_id"];
      await userModel.updateOne({ _id: user_id }, reqBody);
      return { status: "success", message: "Successfully updated user" };
    } else {
      // Return if no user matches the provided NIDNumber
      return {
        status: "fail",
        message: "User not found with the provided Valid NIDNumber",
      };
    }
  } catch (err) {
    if (e.name === "ValidationError") {
      const errors = Object.values(e.errors).map((err) => err.message);
      return { status: "fail", message: errors.join(", ") };
    }
    return { status: "fail", message: `user not found${err}` };
  }
};

const deleteUserServices = async (req, res) => {
  try {
    let { id } = req.params;
    let user_id = req.headers["user_id"];

    if (id !== user_id) {
      return {
        status: "fail",
        message: "Unauthorized or invalid user",
      };
    }

    let result = await userModel.deleteOne({ _id: id });

    if (result.deletedCount > 0) {
      let profile = await profileModel.deleteOne({ UserID: id });
      return { status: "success", message: "Successfully Delete user" };
    } else {
      return { status: "fail", message: "User not found or unauthorized" };
    }
  } catch (err) {
    return { status: "fail", message: `Error deleting user: ${err.message}` };
  }
};

module.exports = {
  registrationServices,
  loginServices,
  SaveProfileService,
  ProfileDetailsReadServices,
  verified,
  GetEmail,
  ProfileUpdateServices,
  deleteUserServices,
};
