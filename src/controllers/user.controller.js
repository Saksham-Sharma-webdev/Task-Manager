
import asyncHandler from "../utils/asyncHandler.js"

const getProfile = asyncHandler(async (req, res) => {
  // take userData from req.user
  // return userData

  const profile = req.user;
  return res
    .status(200)
    .json(new ApiResponse(200, profile, "User profile sent successfully."));
});

const updateProfile = asyncHandler(async(req,res)=>{
  
})

const deleteAccount = asyncHandler(async(req,res)=>{
  
})

const changeEmail = asyncHandler(async(req,res)=>{

})

const changePassword = asyncHandler(async(req,res)=>{
  
})

const uploadAvatar = asyncHandler(async(req,res)=>{
  
})

const deleteAvatar  = asyncHandler(async(req,res)=>{
  
})

export{
  getProfile,
  updateProfile,
  uploadAvatar,
  deleteAvatar,
  changePassword,
  deleteAccount
}