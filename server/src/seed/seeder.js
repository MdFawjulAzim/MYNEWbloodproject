// filepath: e:\Course\Mern\Project Full\Rohan_Blood_Donetion_Project\blooddonate\server\src\seed\seeder.js
require("dotenv").config();
const mongoose = require("mongoose");
const { DATABASE_URL } = require("../config/config");
const userModel = require("../models/userModels");
const donorDetailsModel = require("../models/donorDetailsModels");

// Sample user data (realistic Bangladeshi phones, hashed passwords for demo - use bcrypt in production)
const users = [
  {
    name: "Admin User",
    email: "admin@example.com",
    phone: "01312345678",
    password: "$2a$10$exampleHashedPassword", // Replace with actual hash
    role: "admin",
  },
  {
    name: "Donor One",
    email: "donor1@example.com",
    phone: "01412345678",
    password: "$2a$10$exampleHashedPassword",
    role: "donor",
  },
  {
    name: "Donor Two",
    email: "donor2@example.com",
    phone: "01512345678",
    password: "$2a$10$exampleHashedPassword",
    role: "donor",
  },
  {
    name: "Receiver One",
    email: "receiver1@example.com",
    phone: "01612345678",
    password: "$2a$10$exampleHashedPassword",
    role: "receiver",
  },
];

// Sample donor details (referencing user _ids after insertion)
const donorDetails = [
  {
    blood_group: "A+",
    date_of_birth: new Date("1990-05-15"),
    last_donation_date: new Date("2023-10-01"),
    gender: "Male",
    district: "Dhaka",
    upazila: "Mirpur",
    is_available: true,
  },
  {
    blood_group: "O-",
    date_of_birth: new Date("1985-08-20"),
    last_donation_date: new Date("2023-09-15"),
    gender: "Female",
    district: "Chittagong",
    upazila: "Pahartali",
    is_available: true,
  },
];

const seedData = async () => {
  try {
    console.log("🌱 Connecting to Database...");
    await mongoose.connect(DATABASE_URL, {
      autoIndex: false,
      serverSelectionTimeoutMS: 30000,
    });
    console.log("✅ DB Connected");

    console.log("🗑️ Clearing existing data...");
    await userModel.deleteMany({});
    await donorDetailsModel.deleteMany({});

    console.log("👥 Inserting users...");
    const insertedUsers = await userModel.insertMany(users);
    console.log(`✅ Inserted ${insertedUsers.length} users`);

    console.log("🩸 Inserting donor details...");
    // Map donor details to user _ids (first two users are donors)
    const donorDataWithIds = donorDetails.map((detail, index) => ({
      ...detail,
      user_id: insertedUsers[index]._id,
    }));
    await donorDetailsModel.insertMany(donorDataWithIds);
    console.log(`✅ Inserted ${donorDataWithIds.length} donor details`);

    console.log("🎉 Seeding completed successfully!");
    process.exit(0);
  } catch (error) {
    console.error(`❌ Seeding failed: ${error.message}`);
    process.exit(1);
  }
};

seedData();
