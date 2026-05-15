import { body } from "express-validator";

const createProjectValidator = ()=>{
  return [
    body("name")
      .trim()
      .notEmpty()
      .withMessage("Project name is required")
      .bail()
      .escape()
      .isLength({ min: 5, max: 30 })
      .withMessage("Project name must be between 5 and 30 characters"),
    body("description")
      .trim()
      .notEmpty()
      .withMessage("Project description is required")
      .isLength({ min: 10, max: 200 })
      .withMessage("Project description must be between 10 and 200 characters"),
  ]
}

const updateProjectValidator = ()=>{
  return [
    body("name")
      .optional()
      .trim()
      .escape()
      .isLength({ min: 5, max: 30 })
      .withMessage("Project name must be between 5 and 30 characters"),
    body("description")
      .optional()
      .trim()
      .isLength({ min: 10, max: 200 })
      .withMessage("Project description must be between 10 and 200 characters"),
  ]
}

const addMemberToProjectValidator = ()=>{}

export {
  createProjectValidator,
  updateProjectValidator,
  addMemberToProjectValidator
}