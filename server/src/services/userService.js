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

module.exports = {
  registrationServices,
  loginServices,
};
