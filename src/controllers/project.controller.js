import mongoose from "mongoose";
import Project from "../models/project.model.js";
import ApiResponse from "../utils/api-response.js";
import asyncHandler from "../utils/asyncHandler.js";
import ProjectMember from "../models/projectmember.model.js";
import { UserRoleEnum } from "../constants/constants.js";
import AppError from "../utils/app-error.js";

const getProjects = asyncHandler(async (req, res) => {
  const projects = await Project.find({});

  if (!projects) {
    throw new AppError(400, "No projects found.");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, projects, "This is the list of projects."));
});

const createProject = asyncHandler(async (req, res) => {
  // take the validated name, description from the body
  // take user data from isLoggedIn
  // start atomic instruction
  // create a new project document in project
  // set the createdBy to the user
  // create a new document of ProjectMember
  // set role as admin
  // end atomic instruction
  // return details of the project created

  const { projectName, projectDescription } = req.body;
  const userData = req.user;

  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const projectDocs = await Project.create(
      [
        {
          name: projectName,
          description: projectDescription,
          createdBy: userData.id,
        },
      ],
      { session },
    );

    const project = projectDocs[0];

    await ProjectMember.create(
      [
        {
          user: userData.id,
          project: project._id,
          role: UserRoleEnum.ADMIN,
        },
      ],
      { session },
    );

    await session.commitTransaction();

    return res
      .status(201)
      .json(new ApiResponse(200, project, "project created successfully"));
  } catch (error) {
    await session.abortTransaction();

    throw new AppError(400, "Project creation failed.");
  } finally {
    session.endSession();
  }
});

const getProjectByid = asyncHandler(async (req, res) => {
  // take id from params
  // get project by id

  const { projectId } = req.params;

  const project = await Project.findById(projectId);

  if (!project) {
    throw new AppError(400, "Project not found.");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, project, "This is the requested project."));
});

const updateProject = asyncHandler(async (req, res) => {
  // take the updates from the req.body
  // take the projectId from req.params
  // find the project check if exists
  // make changes save the changes

  const { projectName, projectDescription } = req.body;
  const { projectId } = req.params;

  const project = await Project.findById(projectId);
  if (!project) {
    throw new AppError(400, "Project not found.");
  }

  if (projectName) {
    project.name = projectName;
  }

  if (projectDescription) {
    project.description = projectDescription;
  }

  await project.save();

  return res
    .status(200)
    .json(new ApiResponse(200, project, "Project Updated Successfully."));
});

const deleteProject = asyncHandler(async (req, res) => {
  // take projectId
  // find the project
  // start the session
  // delete all those project members documents where project
  // then delete project
  // end the session

  const { projectId } = req.params;

  const project = await Project.findById(projectId);

  if (!project) {
    throw new AppError(404, "Project not found.");
  }

  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    await ProjectMember.deleteMany(
      {
        project: projectId,
      },
      { session },
    );

    await project.deleteOne({ session });

    await session.commitTransaction();

    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          {},
          "Project deleted successfully and all the members of the project are also removed.",
        ),
      );
  } catch (error) {
    await session.abortTransaction();

    throw new AppError(400, "Project Deletion failed.");
  } finally {
    session.endSession();
  }
});

const getProjectMembers = asyncHandler(async (req, res) => {
  // take the projectId and find the project
  // check if project exists
  // find all the projectMembers whose project

  const {projectId} = req.params

  const projectMembers = await ProjectMember.find({
    project: projectId
  }).populate("user","username email")

  return res.status(200).json(
    new ApiResponse(
      200,
      projectMembers,
      "This is the list of the project members."
    )
  )
});

const addMemberToProject = asyncHandler(async (req, res) => {
  // take user id form req.user 
  // take project Id from params
  // check if project exist 
  // create a document of user in projectMember wtih 
  // set project and user 
  // set role to member
});

const updateMemberRole = asyncHandler(async (req, res) => {
  // take user id from req.user
  // take projectId
  // check if project exist 
  // check if user is a member of project
  // find the projectMember 
  // set the role to be admin 
});

const deleteMember = asyncHandler(async (req, res) => {
  // take user id from the req.user
  // take projectId from params 
  // check if project exist 
  // check if user is a member of the project 
  // then delete projectmember document 
});

export {
  getProjects,
  createProject,
  getProjectByid,
  updateProject,
  deleteProject,
  getProjectMembers,
  addMemberToProject,
  deleteMember,
  updateMemberRole,
};
