import { deleteFromCloudinary } from "../config/cloudinary.js";
import env from "../config/env.js";
import User from "../models/user.model.js";
import ApiResponse from "../utils/api-response.js";
import AppError from "../utils/app-error.js";
import asyncHandler from "../utils/asyncHandler.js";

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

  const {id: userId} = req.user

  const {password} = req.body 

  const user = await User.findById(userId).select("+password")

  if(!user){
    throw new AppError(404, "User not found")
  }

  const match = await user.isPasswordCorrect(password)

  if(!match){
    throw new AppError(401, "Password doesnt match.")
  }

  let result
  if(user.avatar?.public_id){
    result = await deleteFromCloudinary(user.avatar.public_id)
  }

  if(!result){
    console.log("Avatar Deletion Failed.")
  }

  await user.deleteOne()

  const cookieOptions = {
      httpOnly: true,
      secure: env.NODE_ENV === "production",
      sameSite: "strict",
    };

  res.clearCookie("accessToken",cookieOptions)
  res.clearCookie("refreshToken", cookieOptions)

  return res.status(200).json(
    new ApiResponse(
      200,
      {},
      "User deleted successfully."
    )
  )

});

const changeEmail = asyncHandler(async (req, res) => {});

const changePassword = asyncHandler(async (req, res) => {});

const uploadAvatar = asyncHandler(async (req, res) => {});

const deleteAvatar = asyncHandler(async (req, res) => {});

export {
  getProfile,
  updateProfile,
  uploadAvatar,
  deleteAvatar,
  changePassword,
  deleteAccount,
};
