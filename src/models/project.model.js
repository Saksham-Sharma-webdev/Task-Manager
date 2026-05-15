import mongoose, { Schema } from "mongoose";

const projectSchema = new Schema(
  {
    name:{
      type: String,
      trim: true,
      required: true
    },
    description:{
      type: String,
      trim: true,
      required: true
    },
    createdBy:{
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true 
    }
  },
  {timestamps:true}
)

const Project = mongoose.model("Project",projectSchema)

export default Project