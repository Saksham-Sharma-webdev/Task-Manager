import env from "../config/env.js";
import AppError from "../utils/app-error.js";

const globalErrorHandler = (err, req, res, next) => {
  let error = err;

  if (!(error instanceof AppError)) {
    error = new AppError(
      err.statusCode || 500,
      "Internal Server Error",
      [],
      err.stack
    );
  }

  console.error(error); 

  res.status(error.statusCode || 500).json({
    success: false,
    statusCode: error.statusCode,
    message: error.message || "Internal Server Error",
    errors: error.error?.length ? error.error : null,
    stack: env.NODE_ENV === "development" ? error.stack : undefined,
  });
};

export default globalErrorHandler;