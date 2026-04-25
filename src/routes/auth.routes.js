import { Router } from "express";
import { forgotPasswordValidator, resetPasswordValidator, userLoginValidator, userRegValidator, userReVerEmailValidator } from "../validators/auth.validators.js";
import validate from "../middlewares/validator.middleware.js";
import { forgotPassword, loginUser, logoutUser, registerUser, resendVerifyEmail, resetPassword, verifyEmail } from "../controllers/auth.controller.js";
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
  .route("/resend-verification")
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
  .route("/logout")
  .get(
    isLoggedIn,
    logoutUser
  )

authRouter
  .route("/forgot-password")
  .post(
    forgotPasswordValidator(),
    validate,
    forgotPassword
  )

authRouter
  .route("/reset-password/:passwordResetToken")
  .patch(
    resetPasswordValidator(),
    validate,
    resetPassword
  )

export default authRouter