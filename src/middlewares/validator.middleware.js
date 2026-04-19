import { validationResult } from "express-validator";
import AppError from "../utils/app-error.js"
import fs from 'fs'


const validate = (req,res,next)=>{
  const errors = validationResult(req)
  if(errors.isEmpty()){
    return next()
  }

  if (req.file?.path && fs.existsSync(req.file.path)) {
    try {
      fs.unlinkSync(req.file.path);
      console.log("Local file deleted due to validation error");
    } catch (err) {
      console.error("Error deleting file:", err.message);
    }
  }

  const extractedErrors = errors.array().map(err=>({
    field: err.path,
    message: err.msg
  }))

  return next(
    new AppError(
      422,"Validation Failed",extractedErrors
    )
  )
}

export default validate