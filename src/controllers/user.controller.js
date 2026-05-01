import { nullDependencies } from "mathjs";
import {
  deleteFromCloudinary,
  uploadOnCloudinary,
} from "../config/cloudinary.js";
import env from "../config/env.js";
import { changeEmailGenContent, sendMail } from "../config/mail.js";
import User from "../models/user.model.js";
import ApiResponse from "../utils/api-response.js";
import AppError from "../utils/app-error.js";
import asyncHandler from "../utils/asyncHandler.js";
import crypto from "crypto";
import fs from "fs";

const getProfile = asyncHandler(async (req, res) => {
  // take userData from req.user
  // return userData

  const profile = req.user;
  return res
    .status(200)
    .json(new ApiResponse(200, profile, "User profile sent successfully."));
});

const updateProfile = asyncHandler(async (req, res) => {
  // take the fields that are allowed from the req.body and keep in updates object
  // check if updates is empty ?
  // find the user by id and update
  // check the returned updated user

  const updates = {};
  const allowedFields = ["fullname"];
  for (const key of Object.keys(req.body)) {
    if (allowedFields.includes(key)) {
      updates[key] = req.body[key];
    }
  }
  if (Object.keys(updates).length === 0) {
    throw new AppError(400, "No valid fields provided to update.");
  }

  const user = await User.findByIdAndUpdate(req.user.id, updates, {
    new: true,
    runValidators: true,
  });

  if (!user) {
    throw new AppError(404, "User not found");
  }

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        id: user._id,
        fullname: user.fullname,
        username: user.username,
        email: user.email,
      },
      "Profile updated successfully.",
    ),
  );
});

const deleteAccount = asyncHandler(async (req, res) => {
  // take id from user
  // take password from the req.body
  // find user based on the id
  // check if user found ?
  // hash the password and check if match ?
  // delete the avatar uploaded
  // delete the user
  // clear the tokens

  const { id: userId } = req.user;

  const { password } = req.body;

  const user = await User.findById(userId).select("+password");

  if (!user) {
    throw new AppError(404, "User not found");
  }

  const match = await user.isPasswordCorrect(password);

  if (!match) {
    throw new AppError(401, "Password doesnt match.");
  }

  let result;
  if (user.avatar?.public_id) {
    result = await deleteFromCloudinary(user.avatar.public_id);
  }

  if (!result) {
    console.log("Avatar Deletion Failed.");
  }

  await user.deleteOne();

  const cookieOptions = {
    httpOnly: true,
    secure: env.NODE_ENV === "production",
    sameSite: "strict",
  };

  res.clearCookie("accessToken", cookieOptions);
  res.clearCookie("refreshToken", cookieOptions);

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "User deleted successfully."));
});

const requestChangeEmail = asyncHandler(async (req, res) => {
  // take old email, new email and password from user
  // check if newEmail same as old
  // check if newEmail is already in use
  // find user based on the old email
  // check if user exist ?
  // match the password ?
  // generate emailVerToken with expiry
  // save both to db
  // add new email to pending email in db
  // save the db
  // send the emailVerToken to the new Email

  const { email: oldEmail } = req.user;
  const { newEmail, currentPassword } = req.body;

  const normalisedNewEmail = newEmail.toLowerCase().trim();

  if (normalisedNewEmail === oldEmail) {
    throw new AppError(400, "New Email can't be same as old email.");
  }

  const existingUser = await User.findOne({ email: normalisedNewEmail });

  if (existingUser) {
    throw new AppError(400, "Email already in use.");
  }

  const user = await User.findOne({
    email: oldEmail,
  }).select("+password");

  if (!user) {
    throw new AppError(404, "User not found");
  }

  const match = await user.isPasswordCorrect(currentPassword);

  if (!match) {
    throw new AppError(400, "Invalid Credentials.");
  }

  const { unhashedToken, hashedToken, tokenExpiry } =
    user.generateTemporaryToken();

  user.emailVerificationToken = hashedToken;
  user.emailVerificationExpiry = tokenExpiry;
  user.pendingEmail = normalisedNewEmail;

  await user.save();

  const verificationUrl = `${env.BASE_URL}/api/v1/user/me/verify-new-email/${unhashedToken}`;

  console.log(verificationUrl);

  let emailInfoId = null;
  try {
    emailInfoId = await sendMail({
      email: newEmail,
      mailGenContent: changeEmailGenContent(user.fullname, verificationUrl),
      subject: "Verify your new Email address.",
    });
  } catch (err) {
    console.log("Failed sending email: ", err.message);
    throw new AppError(400, "Sending verification email to new email failed.");
  }

  return res
    .status(200)
    .json(new ApiResponse(201, {}, "Check your email to verify."));
});

const verifyNewEmail = asyncHandler(async (req, res) => {
  // take the token from params
  // hash the token
  // find the user based on emailvertoken
  // check expiry
  // set the email to pendingEmail
  // make pendingEmail, vertoken and expiry undefined
  // save the db

  const { emailVerToken } = req.params;

  const hashedEmailVerToken = crypto
    .createHash("sha256")
    .update(emailVerToken)
    .digest("hex");

  const user = await User.findOne({
    emailVerificationToken: hashedEmailVerToken,
  });

  if (!user) {
    throw new AppError(400, "Invalid Verfication Token.");
  }

  if (
    !user.emailVerificationExpiry ||
    user.emailVerificationExpiry.getTime() < Date.now()
  ) {
    throw new AppError(400, "Verification Token Expired.");
  }

  user.email = user.pendingEmail;

  user.emailVerificationExpiry = undefined;
  user.emailVerificationToken = undefined;
  user.pendingEmail = undefined;

  await user.save();

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        username: user.fullname,
        email: user.email,
        isEmailVerified: user.isEmailVerified,
      },
      "New Email verified successfully and set.",
    ),
  );
});

const changePassword = asyncHandler(async (req, res) => {
  // take current password and new password from the user
  // check if both password match ?
  // find user by id
  // match the password ?
  // set the new password in db
  // save the db

  const { currentPassword, newPassword } = req.body;
  const { id } = req.user;

  if (currentPassword === newPassword) {
    throw new AppError(400, "Current password and the new password are same.");
  }

  const user = await User.findById(id).select("+password");

  if (!user) {
    throw new AppError(400, "User not found.");
  }

  const match = await user.isPasswordCorrect(currentPassword);

  if (!match) {
    throw new AppError(400, "Invalid credentials.");
  }

  user.password = newPassword;

  await user.save();

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        id: user.id,
        email: user.email,
      },
      "Password changed successfully.",
    ),
  );
});

const uploadAvatar = asyncHandler(async (req, res) => {
  // check if file present in req.file
  // find the user using id
  // now upload the new avatar
  // delete the local file
  // if not response then image upload failed
  // check if user has already an avatar
  // if has public_id then delete it
  // save the url and public_id in db

  const { id } = req.user;

  if (!req.file?.path) {
    throw new AppError(400, "Avatar file to upload not found.");
  }

  const localFilePath = req.file.path;

  const user = await User.findById(id);

  if (!user) {
    throw new AppError(404, "User not found.");
  }

  const response = await uploadOnCloudinary(localFilePath);

  if (fs.existsSync(localFilePath)) {
    fs.unlinkSync(localFilePath);
  }

  if (!response) {
    console.error("Avatar upload failed.");
    throw new AppError(400, "Avatar Image upload failed.");
  }

  if (user.avatar?.public_id) {
    try {
      const publicId = user.avatar.public_id;
      const result = await deleteFromCloudinary(publicId);
    } catch (err) {
      console.log(
        `Cloudinary Cleanup failed: ${err.message} continuing without it.`,
      );
    }
  }

  user.avatar = {
    url: response.secure_url,
    public_id: response.public_id,
  };

  await user.save();

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        id: user._id,
        avatar: user.avatar.url,
      },
      "Avatar uploaded successfully.",
    ),
  );
});

const deleteAvatar = asyncHandler(async (req, res) => {
  // find user by id 
  // check if there is public_id of avatar
  // delete file from cloudinary
  // remove url and public_id from database

  const user = await User.findById(req.user.id)

  if(!user){
    throw new AppError(404, "User not found.")
  }

  if(!user.avatar?.public_id){
    throw new AppError(
      400,
      "User has no avatar available to delete."
    )
  }

  await deleteFromCloudinary(user.avatar.public_id)

  user.avatar = {
    url: undefined,
    public_id: undefined
  }

  await user.save()

  return res.status(200).json(
    new ApiResponse(200,{},"Avatar deleted successfully.")
  )


});

export {
  getProfile,
  updateProfile,
  uploadAvatar,
  deleteAvatar,
  changePassword,
  deleteAccount,
  requestChangeEmail,
  verifyNewEmail,
};
