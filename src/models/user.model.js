import mongoose from "mongoose";
import { AvailableUserRoles, UserRoleEnum } from "../constants/constants.js";
import {env} from "../config/env.js"


const userSchema = new Schema(
  {
    avatar:{
      type:{
        url: String,
        localPath: String
      },
      default:{
        url:"",
        localPath: ""
      }
    },
    username:{
      type: String,
      required: true,
      lowercase: true,
      trim: true ,
      unique: true,
    },
    email:{
      type: String,
      required: true,
      lowercase: true,
      trim: true 
    },
    fullname:{
      type: String,
      required: true,
      trim: true
    },
    password:{
      type: String,
      required: [true,"password is required"],
      trim: true,
      select: false 
    },
    role: {
      type: String,
      enum: AvailableUserRoles,
      default: UserRoleEnum.MEMBER,
      required: true 
    },
    isEmailVerified:{
      type: Boolean,
      default: false 
    },
    forgotPasswordToken:{
      type: String
    },
    forgotPasswordExpiry:{
      type: Date 
    },
    emailVerificationToken:{
      type: String
    },
    emailVerificationExpiry:{
      type: Date 
    },
    refreshToken:{
      type: String
    }
  },
  {timeStamps: true}
)

userSchema.mehods.isPasswordCorrect = async function(password){
  return await bcrypt.compare(password,this.password)
}

userSchema.mehods.generateAccessToken = async function(){
  const payload ={
    _id: this._id
  }

  return jwt.sign(payload,env.ACCESS_TOKEN_SECRET,{expiresIn:env.ACCESS_TOKEN_EXPIRY})
}

userSchema.mehods.generateRefreshToken = async function(){
  const payload ={
    _id: this._id
  }

  return jwt.sign(payload,env.REFRESH_TOKEN_SECRET,{expiresIn:env.REFRESH_TOKEN_EXPIRY})
}

userSchema.methods.generateTemporaryToken=function(){
  const unhashedToken = crypto.randomBytes(20).toString("hex")

  const hashedToken = crypto
    .createHash("sha256")
    .update(unhashedToken)
    .digest("hex")

  const tokenExpiry = Date.now() +
  Number(env.TEMP_TOKEN_EXPIRY)

  return { unhashedToken, hashedToken, tokenExpiry}
}

userSchema.pre("save",async function(){
  if(this.isModified("password")){
    this.password = await bcrypt.hash(this.password,10)
  }
})

const User = mongoose.model("User",userSchema)

export default User
