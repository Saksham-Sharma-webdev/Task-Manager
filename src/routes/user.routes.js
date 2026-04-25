import { Router } from "express";
import { isLoggedIn } from "../middlewares/auth.middleware.js";
import { changePassword, deleteAvatar, deleteAccount, getProfile, updateProfile, uploadAvatar } from "../controllers/user.controller.js";

const userRouter = Router()

userRouter.use(isLoggedIn);

userRouter
  .route("/me")
  .get(
    getProfile
   )
  .patch(
    updateProfile
  )
  .delete(
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