import mongoose from "mongoose";

const noteSchema = new Schema(
  {
    project:{
      type: Schemes.Types.ObjectId,
      ref: "Projecct",
      required: true 
    },
    createdBy:{
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    content:{
      type: String,
      required: true 
    }
  },
  {timeStamps: true}
)

const ProjectNote = mongoose.model("ProjectNote",noteSchema)

export default ProjectNote 
