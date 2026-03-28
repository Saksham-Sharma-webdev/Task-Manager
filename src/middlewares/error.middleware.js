import AppError from "../utils/app-error.js";

const globalErrorHandler = (err, req, res, next) => {
  let error = err

  if(!(error instanceof AppError)){
    error = new AppError(
      err.statusCode|| 500,
      err.message || "Internal Server Error",
      [],
      err.stack
    )
  }

  err && console.log(err)
  res.status(err.statusCode || 500).json({
    success: false,
    statusCode: err.statusCode,
    message: err.message || "Internal Server Error",
    errors: err.error || null,
  });
}

export default globalErrorHandler