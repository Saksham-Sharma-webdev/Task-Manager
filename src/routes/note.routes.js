import { Router } from "express";

const noteRouter = Router()

noteRouter
  .route("/:projectId")
  .get()

noteRouter
  .route("/")
  .get()

noteRouter
  .route("/resend-verification-email")
  .post()

noteRouter
  .route("/login")
  .post()

noteRouter
  .route("/profile")
  .get()

noteRouter
  .route("/logout")
  .get()

noteRouter
  .route("/forgot-password")
  .get()

noteRouter
  .route("/reset-password")
  .get()

export default noteRouter