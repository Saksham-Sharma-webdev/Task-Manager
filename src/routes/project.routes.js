import { Router } from "express";
import { addMemberToProject, createProject, deleteMember, deleteProject, getProjectByid, getProjectMembers, getProjects, updateMemberRole, updateProject } from "../controllers/project.controller.js";
import { isLoggedIn, validateProjectPermission } from "../middlewares/auth.middleware.js";
import { AvailableUserRoles, UserRoleEnum } from "../constants/constants.js";
import validate from "../middlewares/validator.middleware.js";
import { addMemberToProjectValidator, createProjectValidator, updateProjectValidator } from "../validators/project.validators.js";

const projectRouter = Router()

projectRouter.use(isLoggedIn)

projectRouter
  .route("/")
  .get(
    getProjects
  )
  .post(
    createProjectValidator(),
    validate,
    createProject
  )

projectRouter
  .route("/:projectId")
  .get(
    validateProjectPermission(AvailableUserRoles),
    getProjectByid
  )
  .patch(
    validateProjectPermission([UserRoleEnum.ADMIN, UserRoleEnum.PROJECT_ADMIN]),
    updateProjectValidator,
    validate,
    updateProject
  )
  .delete(
    validateProjectPermission([UserRoleEnum.ADMIN, UserRoleEnum.PROJECT_ADMIN]),
    deleteProject
  )

projectRouter
  .route("/:projectId/members")
  .get(
    validateProjectPermission(AvailableUserRoles),
    getProjectMembers
  )
  .post(
    validateProjectPermission([UserRoleEnum.ADMIN, UserRoleEnum.PROJECT_ADMIN]),
    addMemberToProjectValidator(),
    validate, 
    addMemberToProject
  )

projectRouter
  .route("/:projectId/m/:memberId")
  .put(
    validateProjectPermission([UserRoleEnum.ADMIN, UserRoleEnum.PROJECT_ADMIN]),
    updateMemberRole
  )
  .delete(
    validateProjectPermission([UserRoleEnum.ADMIN, UserRoleEnum.PROJECT_ADMIN]),
    deleteMember
  )

export default projectRouter