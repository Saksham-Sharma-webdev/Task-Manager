import { body, oneOf } from "express-validator";

const emailValidator = (field) => {
  return [
    body(field)
      .trim()
      .notEmpty()
      .withMessage("Email is required")
      .bail()
      .isEmail()
      .withMessage("Email format is invalid."),
  ];
};

const passwordValidator = (field) => {
  return [
    body(field)
      .notEmpty()
      .withMessage("Password is required")
      .bail()
      .isLength({ min: 8, max: 15 })
      .withMessage("Password must be between 8 and 15 characters.")
      .bail()
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,15}$/)
      .withMessage(
        "Password must be 8–15 characters and include atleast one uppercase, lowercase, number and special character",
      ),
  ];
};

const usernameValidator = (field) => {
  return [
    body(field)
      .trim()
      .notEmpty()
      .withMessage("Username is required")
      .bail()
      .isLength({ min: 5, max: 15 })
      .withMessage("Username must be between 5 and 15 characters")
      .bail()
      .matches(/^(?![._])(?!.*[._]{2})[a-z0-9._]{5,15}(?<![._])$/)
      .withMessage(
        "Username can only contain letters, numbers, _ and ."
      ),
  ];
};

const userRegValidator = () => {
  return [
    ...usernameValidator("username"),
    ...emailValidator("email"), 
    ...passwordValidator("password"),
    body("fullname")
      .trim()
      .notEmpty()
      .withMessage("Fullname is required")
      .bail()
      .escape()
      .isLength({ min: 5, max: 30 })
      .withMessage("Fullname must be between 5 and 30 characters")
  ];
};

const userReVerEmailValidator = ()=>{
  return[
    ...emailValidator('email'),
    ...passwordValidator('password')
  ]
}

// look at the one field called 'identifier' try to validate it as an email if that fails try to validate that same 'identifier' field as a username
// oneOf works like or here 
const userLoginValidator = ()=>{
  return[

    oneOf([
      ...emailValidator("identifier"), 
      ...usernameValidator("identifier")
    ], {
      message: "Identification must be a valid email or username."
    }),

    ...passwordValidator("password")
  ]
}

const forgotPasswordValidator = ()=>{
  return[
    oneOf([
      ...emailValidator("identifier"), 
      ...usernameValidator("identifier")
    ], {
      message: "Identification must be a valid email or username."
    })
  ]
}

const resetPasswordValidator = ()=>{
  return[
    ...passwordValidator('newPassword'),
    ...passwordValidator('confirmNewPassword')
  ]
}

export {
  userRegValidator,
  userReVerEmailValidator,
  userLoginValidator,
  forgotPasswordValidator,
  resetPasswordValidator
}