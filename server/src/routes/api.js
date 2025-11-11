const express = require("express");
const passport = require("passport");
const userControllers = require("../controller/userControllers");
const userFindController = require("../controller/userFindController");
const locationController = require("../controller/locationController");
const ImageUploadController = require("../controller/ImageUploadController");
const authMiddleware = require("../middlewares/authMiddleware");
const cloudUpload = require("../middlewares/CloudMulter");
const PostController = require("../controller/postController");
const donorController = require("../controller/donorController");

const router = express.Router();

// ----------------------------------------------------------------//
// Auth
router.post("/registration", userControllers.register);
router.post("/login", userControllers.login);
router.get("/logout", authMiddleware, userControllers.logout);

// ----------------------------------------------------------------//
// DonorDetails CRUD
router.post("/donors", authMiddleware, donorController.create); // Create (donors/admin)
router.get("/donors/me", authMiddleware, donorController.readMe); // Read own
router.get("/donors/:id", donorController.readOne); // Single read by donor_details id
router.patch("/donors/me", authMiddleware, donorController.updateMe); // Update own
router.delete("/donors/me", authMiddleware, donorController.softDeleteMe); // Soft delete own

// ----------------------------------------------------------------//
// Keep your existing search/location/post routes
router.get("/findByAllUsers", userFindController.findByAllUsers);
router.get("/CountBloodGroupUser", userFindController.CountBloodGroupUser);
router.get(
  "/findByBloodGroup/:bloodGroup",
  userFindController.findByBloodGroup
);
router.get("/findByDivision/:Division", userFindController.findByDivision);
router.get("/findByZila/:zila", userFindController.findByZila);
router.get("/findByUpzila/:upzila", userFindController.findByUpzila);
router.get("/findByName/:Keyword", userFindController.findByName);

router.get("/GetDivisions", locationController.GetDivisionsController);
router.get("/Get", locationController.GetController);
router.get("/GetZila/:division", locationController.GetZilaController);
router.get("/GetUpzila/:zila", locationController.GetUpzilaController);

// Image Upload Cloudinary
router.post(
  "/upload-image",
  cloudUpload.single("image"),
  ImageUploadController.uploadCloudinaryController
);

// Posts
router.post(
  "/create-post",
  authMiddleware,
  PostController.createPostControllers
);
router.get("/read-post/:postId", PostController.readPostControllers);
router.get(
  "/get-post-user",
  authMiddleware,
  PostController.getPostUserControllers
);
router.get("/get-post", PostController.getPostControllers);
router.post(
  "/comment-post/:postId",
  authMiddleware,
  PostController.commentPostControllers
);
router.post(
  "/like-post/:postId",
  authMiddleware,
  PostController.likePostControllers
);

module.exports = router; // CommonJS ব্যবহার করুন
