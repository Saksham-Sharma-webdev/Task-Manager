import multer from "multer";
import fs from "fs";
import path from "path"
import AppError from "../utils/app-error.js";

const uploadPath = "./public/images";

// store the file in the local disk storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadPath);
  },

  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    const ext = path.extname(file.originalname)
    cb(null, file.fieldname + '-' + uniqueSuffix  + ext)
  },
});

// filters for saving file
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image/")) {
    cb(null, true);
  } else {
    cb(new Error("Only image files are allowed"), false);
  }
};


// Returns a Multer instance that provides several methods for generating middleware that process files uploaded in multipart/form-data format.
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 2 * 1024 * 1024, // 2MB
  },
});
// this multer also help to process multipart/form-data

// a fn that takes fileName field and return a middleware that checks, process the image and then store on disk
const uploadSingle = (fieldName) => {
  return (req, res, next) => {

    upload.single(fieldName)(req, res, (err) => {
      if (err) {
        if (err.code === "LIMIT_FILE_SIZE") {
          return next(new AppError(400,"File size exceeds 2MB"));
        }

        return next(new AppError(400,err.message));
      }

      next();
    });
    
  };
};

export default uploadSingle