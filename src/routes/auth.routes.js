import { Router } from "express";
import { userLoginValidator, userRegValidator, userReVerEmailValidator } from "../validators/auth.validators.js";
import validate from "../middlewares/validator.middleware.js";
import { getProfile, loginUser, registerUser, resendVerifyEmail, verifyEmail } from "../controllers/auth.controller.js";
import uploadSingle from "../middlewares/multer.middleware.js";
import { isLoggedIn } from "../middlewares/auth.middleware.js";

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

authRouter
  .route("/resend-verification-email")
  .post(
    userReVerEmailValidator(),
    validate,
    resendVerifyEmail
  )

authRouter
  .route("/login")
  .post(
    userLoginValidator(),
    validate,
    loginUser
  )

authRouter
  .route("/profile")
  .get(
    isLoggedIn,
    getProfile
  )

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