import { Router } from "express";
import { isLoggedIn } from "../middlewares/auth.middleware.js";
import { changePassword, deleteAvatar, deleteAccount, getProfile, updateProfile, uploadAvatar, requestChangeEmail, verifyNewEmail } from "../controllers/user.controller.js";
import { changePasswordValidator, deleteAccountValidator, requestChangeEmailValidator, updateProfileValidator } from "../validators/user.validators.js";
import validate from "../middlewares/validator.middleware.js";
import uploadSingle from "../middlewares/multer.middleware.js";

const userRouter = Router()

userRouter.use(isLoggedIn);

userRouter
  .route("/me")
  .get(
    getProfile
   )
  .patch(
    updateProfileValidator(),
    validate,
    updateProfile
  )
  .delete(
    deleteAccountValidator(),
    validate,
    deleteAccount
  )

userRouter
  .route("/me/request-change-email")
  .post(
    requestChangeEmailValidator(),
    validate,
    requestChangeEmail
  )

userRouter
  .route("/me/verify-new-email/:emailVerToken")
  .get(
    verifyNewEmail
  )

userRouter
  .route("/me/avatar")
  .patch(
    uploadSingle("profilePic"),
    uploadAvatar
  )
  .delete(
    deleteAvatar
  )

userRouter
  .route("/me/password")
  .patch(
    changePasswordValidator(),
    validate,
    changePassword
  )

export default userRouter