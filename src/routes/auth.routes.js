import { Router } from "express";
import { userRegValidator } from "../validators/auth.validators.js";
import validate from "../middlewares/validator.middleware.js";
import { registerUser, verifyEmail } from "../controllers/auth.controller.js";
import uploadSingle from "../middlewares/multer.middleware.js";

const authRouter = Router()

authRouter
  .route("/register")
  .post(
    uploadSingle("profilePic"),
    userRegValidator(),
    validate,
    registerUser
  )

authRouter
  .route("/verify-email/:emailVerToken")
  .get(verifyEmail)

// authRouter
//   .route("/resend-verification-email")
//   .post()

// authRouter
//   .route("/login")
//   .post()

// authRouter
//   .route("/profile")
//   .get()

// authRouter
//   .route("/logout")
//   .get()

// authRouter
//   .route("/forgot-password")
//   .get()

// authRouter
//   .route("/reset-password")
//   .get()

export default authRouter