import { Router } from "express";

const authRouter = Router()

authRouter
  .route("/register")
  .post()

authRouter
  .route("/verify-email/:emailVerToken")
  .get()

authRouter
  .route("/resend-verification-email")
  .post()

authRouter
  .route("/login")
  .post()

authRouter
  .route("/profile")
  .get()

authRouter
  .route("/logout")
  .get()

authRouter
  .route("/forgot-password")
  .get()

authRouter
  .route("/reset-password")
  .get()

export default authRouter