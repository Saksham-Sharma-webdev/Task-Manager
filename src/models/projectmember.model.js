import mongoose from "mongoose";
import { AvailableUserRoles, UserRoleEnum } from "../constants/constants.js";

const projectMemberSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true 
    },
    project: {
      type: Schema.Types.ObjectId,
      ref: "Project",
      required: true 
    },
    role: {
      type: String,
      enum: AvailableUserRoles,
      default: UserRoleEnum.MEMBER
    }
  },
  {timestamps:true}
)

const ProjectMember = mongoose.model("ProjectMember",projectMemberSchema)

export default ProjectMember