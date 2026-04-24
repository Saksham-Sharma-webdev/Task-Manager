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
import crypto from "crypto";
import ms from "ms";

const registerUser = asyncHandler(async (req, res) => {
  // take username, email, fullname, password from req.body
  // already validated using MW
  // check if user already exist by email or username
  // if existing user abort req and delete uploaded img from disk
  // otw if profile pic path exist upload img on cloudinary
  // after upload delete the local file
  // create user
  // add avatar prop only if profile pic url exist
  // hash password (will be done while saving the password)
  // create userVerToken
  // save the hashed token to db
  // set emailToken expiry
  // save the user
  // delete image from cloudinary if any error come during save db
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

  let profilePicUrl = null;
  let profilePicPublicId = null;

  if (req.file?.path) {
    const localFilePath = req.file.path;
    const response = await uploadOnCloudinary(localFilePath);
    if (fs.existsSync(localFilePath)) {
      fs.unlinkSync(localFilePath);
    }
    if (response) {
      profilePicUrl = response.secure_url;
      profilePicPublicId = response.public_id;
    } else {
      console.error("Image upload failed, continuing without avatar.");
    }
  }

  let user;
  let unhashedToken;
  try {
    const userData = {
      username,
      email,
      fullname,
      password,
    };

    if (profilePicUrl) {
      userData.avatar = {
        url: profilePicUrl,
        public_id: profilePicPublicId,
      };
    }

    user = await User.create(userData);

    const tokenData = user.generateTemporaryToken();

    unhashedToken = tokenData.unhashedToken;

    user.emailVerificationToken = tokenData.hashedToken;
    user.emailVerificationExpiry = tokenData.tokenExpiry;

    await user.save({ validateBeforeSave: false });
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

  const verificationUrl = `${env.BASE_URL}/api/v1/auth/verify-email/${unhashedToken}`;

  console.log(verificationUrl);

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
    emailVerificationToken: hashedEmailVerToken,
  });

  if (!user) {
    throw new AppError(400, "Invalid verification token.");
  }

  if (user.isEmailVerified) {
    throw new AppError(400, "Email is already verified.");
  }

  if (
    !user.emailVerificationExpiry ||
    user.emailVerificationExpiry.getTime() < Date.now()
  ) {
    throw new AppError(400, "Verification token expired.");
  }

  user.isEmailVerified = true;
  user.emailVerificationExpiry = null;
  user.emailVerificationToken = null;

  await user.save();

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        username: user.username,
        isEmailVerified: user.isEmailVerified,
      },
      "Email Verified successfully.",
    ),
  );
});

const resendVerifyEmail = asyncHandler(async (req, res) => {
  // take email, password from the user
  // validated by mw
  // find user on basis of email
  // check if user exist
  // hash the password
  // match the password
  // check if email already verified
  // check if there is already a valid token in db
  // create a email ver token and expiry
  // store the hashed token and expiry to db
  // save the user
  // create a verification email with the unhashed token and send email

  const { email, password } = req.body;

  const user = await User.findOne({
    email,
  }).select("+password");

  if (!user) {
    throw new AppError(401, "Invalid email or password.");
  }

  const matchPassword = await user.isPasswordCorrect(password);

  if (!matchPassword) {
    throw new AppError(401, "Invalid email or password.");
  }

  if (user.isEmailVerified) {
    return res.status(200).json(
      new ApiResponse(
        200,
        {
          email: user.email,
          isEmailVerified: user.isEmailVerified,
        },
        "Email already verified.",
      ),
    );
  }

  if (
    user.emailVerificationExpiry &&
    user.emailVerificationExpiry > Date.now()
  ) {
    throw new AppError(429, "Verification email already sent. Please wait.");
  }

  const { unhashedToken, hashedToken, tokenExpiry } =
    user.generateTemporaryToken();

  user.emailVerificationExpiry = tokenExpiry;
  user.emailVerificationToken = hashedToken;

  await user.save({ validateBeforeSave: false });

  const verificationUrl = `${env.BASE_URL}/api/v1/auth/verify-email/${unhashedToken}`;

  let emailInfoId = null;
  try {
    emailInfoId = await sendMail({
      email: user.email,
      mailGenContent: emailVerifyGenContent(user.fullname, verificationUrl),
      subject: "To verify your email.",
    });
  } catch (err) {
    user.emailVerificationExpiry = null;
    user.emailVerificationToken = null;

    await user.save({ validateBeforeSave: false });
    throw new AppError(500, "Verification email failed.");
  }

  return res.status(200).json(
    new ApiResponse(
      200,
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

const loginUser = asyncHandler(async (req, res) => {
  // take identifier(email or username) from user
  // take password from user
  // validated by mw
  // find the user based on the identifier $or db querry
  // check if user exist ?
  // hash and match the password ?
  // check if user email verified
  // create a jwt accessT
  // sign the jwt accessT
  // same for refreshT
  // save the hashedrefreshT to db
  // save both to the cookies with options

  const { identifier, password } = req.body;

  const user = await User.findOne({
    $or: [{ email: identifier }, { username: identifier }],
  }).select("+password +refreshToken");

  if (!user) {
    throw new AppError(401, "Invalid credentials.");
  }

  const matchPassword = await user.isPasswordCorrect(password);

  if (!matchPassword) {
    throw new AppError(401, "Invalid credentials.");
  }

  if (!user.isEmailVerified) {
    throw new AppError(400, "Email is not verified.");
  }

  if (user.refreshToken) {
    user.refreshToken = null;
  }

  const accessToken = user.generateAccessToken();
  const refreshToken = user.generateRefreshToken();

  user.refreshToken = refreshToken;
  await user.save({ validateBeforeSave: false });

  const cookieOptions = {
    httpOnly: true,
    secure: env.NODE_ENV === "production",
    sameSite: "strict",
  };

  res.cookie("accessToken", accessToken, {
    ...cookieOptions,
    maxAge: ms(env.ACCESS_TOKEN_EXPIRY),
  });

  res.cookie("refreshToken", refreshToken, {
    ...cookieOptions,
    maxAge: ms(env.REFRESH_TOKEN_EXPIRY),
  });

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        id: user._id,
        username: user.username,
        email: user.email,
      },
      "User loggedIn successfully.",
    ),
  );
});

const getProfile = asyncHandler(async (req, res) => {
  // take userData from req.user
  // return userData

  const profile = req.user;
  return res
    .status(200)
    .json(new ApiResponse(200, profile, "User profile sent successfully."));
});

const logoutUser = asyncHandler(async (req, res) => {
  // find user based on the req.user
  // in db make refreshToken to null
  // save db
  // now clear cookies refreshT and accessT

  const user = await User.findById(req.user.id)

  const cookieOptions = {
    httpOnly: true,
    secure: env.NODE_ENV === "production",
    sameSite: "strict"
  };

  res.clearCookie("accessToken", cookieOptions)
  res.clearCookie("refreshToken", cookieOptions)
  
  return res.status(200).json(
    new ApiResponse(
      200,
      {
        id: user.id,
        username: user.username
      },
      "User logged out successfully."
    )
  )
});

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
