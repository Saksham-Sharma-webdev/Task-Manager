import mongoose from "mongoose";

const taskSchema = new Schema(
  {
    title:{
      type: String,
      required: true,
      trim: true 
    },
    description: {
      type: String,
      required: true,
      trim: true 
    },
    project: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true 
    },
    status: {
      type: String,
      enum: AvailableTaskStatus,
      default: TaskStatusEnum.TODO
    },
    attachments: {
      type:{
        url: String,
        mimetype: String,
        size: Number 
      },
      default: []
    }
  },
  {timestamps: true} 
)

const Task = mongoose.model("taskSchema",taskSchema)

export default Task