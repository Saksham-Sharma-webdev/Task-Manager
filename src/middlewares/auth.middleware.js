import asyncHandler from "../utils/asyncHandler.js";
import env from "../config/env.js";
import jwt from "jsonwebtoken";
import AppError from "../utils/app-error.js";
import User from "../models/user.model.js";
import ms from "ms";

const verifyAccessToken = async (accessToken) => {
  // verify the token ?
  // find user based on _id in token
  // check if user exist ?
  // return user

  const decodedAccessToken = jwt.verify(accessToken, env.ACCESS_TOKEN_SECRET);

  const user = await User.findById(decodedAccessToken._id).select(
    "_id username email fullname isEmailVerified role createdAt avatar",
  );

  if (!user) {
    throw new AppError(404, "User not found.");
  }

  return user;
};

const verifyRefreshToken = async (refreshToken) => {
  // verify the token ?
  // find user based on _id in token
  // check if user exist ?
  // check if there is refreshToken in db
  // check if refreshToken in db matches the refreshToken
  // if yes then create new accessT and refreshT
  // return the user and these new tokens

  let decodedRefreshToken;
  try {
    decodedRefreshToken = jwt.verify(refreshToken, env.REFRESH_TOKEN_SECRET);
  } catch (err) {
    throw new AppError(401, "Invalid or expired token.");
  }

  const user = await User.findById(decodedRefreshToken._id)
    .select("_id username email fullname isEmailVerified role createdAt avatar")
    .select(" +refreshToken");

  if (!user) {
    throw new AppError(404, "User not found.");
  }

  if (!user.refreshToken || !(await user.isRefreshTokenMatch(refreshToken))) {
    throw new AppError(401, "Unauthorised access, token mismatch.");
  }

  const newAccessToken = user.generateAccessToken();
  const newRefreshToken = user.generateRefreshToken();

  user.refreshToken = newRefreshToken;
  await user.save({ validateBeforeSave: false });

  return { user, newAccessToken, newRefreshToken };
};

const setAuthCookies = (res, accessToken, refreshToken) => {
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
};

const isLoggedIn = asyncHandler(async (req, res, next) => {
  // take accessToken and refreshToken from the cookies
  // check if both not present then unauthorised access
  // check if accessToken present
  // if yes then decode it and return user
  // if error comes in decoding accessT ( can be expired ) then
  // also no refreshT and TokenExpiredError then throw error
  // if refreshT present then try decode it

  const { accessToken: accessT, refreshToken: refreshT } = req.cookies;

  const cookieOptions = {
    httpOnly: true,
    secure: env.NODE_ENV === "production",
    sameSite: "strict",
  };

  if (!accessT && !refreshT) {
    throw new AppError(401, "Unauthorised access. No tokens present.");
  }
  let user = null;
  if (accessT) {
    try {
      user = await verifyAccessToken(accessT);
    } catch (err) {
      if (!refreshT || !(err instanceof jwt.TokenExpiredError)) {
        res.clearCookie("accessToken",cookieOptions);
        res.clearCookie("refreshToken",cookieOptions);
        throw new AppError(401, "Invalid or expired token.");
      }
      const result = await verifyRefreshToken(refreshT);

      setAuthCookies(res, result.newAccessToken, result.newRefreshToken);

      user = result.user;
    }
  } else if (refreshT) {
    const result = await verifyRefreshToken(refreshT);

    setAuthCookies(res, result.newAccessToken, result.newRefreshToken);

    user = result.user;
  }

  if (!user) {
    res.clearCookie("accessToken", cookieOptions);
    res.clearCookie("refreshToken",cookieOptions);
    throw new AppError(401, "Invalid or expired token.");
  }
  const data = {
    id: user._id,
    fullName: user.fullname,
    email: user.email,
    username: user.username,
    isEmailVerified: user.isEmailVerified,
    role: user.role,
    createdAt: user.createdAt,
    avatarUrl: user.avatar?.url || null
  };
  req.user = data;

  next();
});

const validateProjectPermission = asyncHandler(async (req, res) => {});

export { isLoggedIn, validateProjectPermission };
