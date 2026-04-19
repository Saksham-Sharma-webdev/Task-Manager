import {
  uploadOnCloudinary,
  deleteFromCloudinary,
} from "../config/cloudinary.js";
import env from "../config/env.js";
import { emailVerifyGenContent, sendMail } from "../config/mail.js";
import User from "../models/user.model.js";
import ApiResponse from "../utils/api-response.js";
import AppError from "../utils/app-error.js";
import asyncHandler from "../utils/asyncHandler.js";
import fs from "fs";
import crypto from "crypto"

const registerUser = asyncHandler(async (req, res) => {
  // take username, email, fullname, password from req.body
  // already validated using MW
  // check if user already exist by email or username
  // if existing user abort req and delete uploaded img from disk
  // if profile pic path exist upload img on cloudinary
  // create user
  // add avatar prop only if profile pic url exist
  // hash password (will be done while saving the password)
  // create userVerToken
  // save the hashed token to db
  // set emailToken expiry
  // save the user
  // send the verification email with email verification token

  const { username, email, fullname, password } = req.body;

  const existingUser = await User.findOne({
    $or: [{ email }, { username }],
  });

  if (existingUser) {
    if (req.file?.path && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    throw new AppError(409, "Email or username already registered.");
  }

  let profilePicUrl = "";
  let profilePicPublicId = "";

  if (req.file?.path) {
    const response = await uploadOnCloudinary(req.file.path);

    if (response) {
      profilePicUrl = response.secure_url;
      profilePicPublicId = response.public_id;
    } else {
      console.error("Image upload failed, continuing without avatar.");
    }
  }

  let user;
  try {
    user = await User.create({
      username,
      email,
      fullname,
      password,
    });
    if (profilePicUrl) {
      user.avatar.url = profilePicUrl;
      user.avatar.public_id = profilePicPublicId || null;
    }
  } catch (err) {
    if (profilePicPublicId) {
      try {
        await deleteFromCloudinary(profilePicPublicId);
      } catch (cleanupErr) {
        console.error("Cloudinary cleanup failed:", cleanupErr.message);
      }
    }
    throw new AppError(500, "User creation failed.");
  }

  const { unhashedToken, hashedToken, tokenExpiry } =
    user.generateTemporaryToken();
  user.emailVerificationToken = hashedToken;
  user.emailVerificationExpiry = tokenExpiry;

  await user.save({ validateBeforeSave: false });

  const verificationUrl = `${env.BASE_URL}/api/v1/auth/verify-email/${unhashedToken}`;
  console.log(verificationUrl)
  let emailInfoId = null;
  try {
    emailInfoId = await sendMail({
      email: user.email,
      mailGenContent: emailVerifyGenContent(user.fullname, verificationUrl),
      subject: "To verify your email.",
    });
  } catch (err) {
    console.log("Failed sending email: ", err.message);
  }

  return res.status(201).json(
    new ApiResponse(
      201,
      {
        username: user.username,
        email: user.email,
        fullname: user.fullname,
      },
      emailInfoId
        ? "User registered successfully. Check your email to verify"
        : "User registered successfully. But failed to send verification email. Please resend verification email.",
    ),
  );
});

const verifyEmail = asyncHandler(async (req, res) => {
  // take the token from the user
  // hash the token
  // find the user with same verTOken
  // check the expiry in db
  // if everything right then make isVerified true
  // make the token and expiry field null in db
  // save the user

  const { emailVerToken } = req.params;

  if (!emailVerToken) {
    throw new AppError(400, "Verification token is required.");
  }

  const hashedEmailVerToken = crypto
    .createHash("sha256")
    .update(emailVerToken)
    .digest("hex");

  const user = await User.findOne({
    emailVerificationToken: hashedEmailVerToken
  })

  if(!user){
    throw new AppError(400, "Invalid verification token.")
  }

  if (user.emailVerificationExpiry < Date.now()) {
    throw new AppError(400, "Verification token expired.");
  }
  
  user.isEmailVerified = true
  user.emailVerificationExpiry = undefined
  user.emailVerificationToken = undefined

  await user.save()

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        username: user.username,
        isEmailVerified: user.isEmailVerified
      },
      "Email Verified successfully."
    )
  )
});

const resendVerifyEmail = asyncHandler(async (req, res) => {});

const loginUser = asyncHandler(async (req, res) => {});

const getProfile = asyncHandler(async (req, res) => {});

const logoutUser = asyncHandler(async (req, res) => {});

const forgotPassword = asyncHandler(async (req, res) => {});

const resetPassword = asyncHandler(async (req, res) => {});

const uploadAvatar = asyncHandler(async (req, res) => {});

export {
  registerUser,
  verifyEmail,
  resendVerifyEmail,
  loginUser,
  getProfile,
  logoutUser,
  forgotPassword,
  resetPassword,
  uploadAvatar,
};
