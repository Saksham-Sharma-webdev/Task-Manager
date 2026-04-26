import { Router } from "express";
import { isLoggedIn } from "../middlewares/auth.middleware.js";
import { changePassword, deleteAvatar, deleteAccount, getProfile, updateProfile, uploadAvatar } from "../controllers/user.controller.js";
import { deleteAccountValidator, updateProfileValidator } from "../validators/user.validators.js";
import validate from "../middlewares/validator.middleware.js";

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
  .route("/me/avatar")
  .patch(
    uploadAvatar
  )
  .delete(
    deleteAvatar
  )

userRouter
  .route("/me/password")
  .patch(
    changePassword
  )

export default userRouter