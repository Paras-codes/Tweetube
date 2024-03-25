import mongoose, {Types, isValidObjectId} from "mongoose"
import {Like} from "../models/like.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const toggleVideoLike = asyncHandler(async (req, res) => {
   
    const { videoId } = req.params
    const _id=req.user?._id;
    if(!_id)
    {
        throw new ApiError(404,"Unauthourized acess")
    }
    if(!isValidObjectId(videoId)){
        throw new ApiError(404,"invalid videId")
    }

    const likeDoc=await Like.findByIdAndDelete(videoId)
    
    if(!likeDoc){
       await Like.create({
        video:new mongoose.Types.ObjectId(videoId),
        like: new mongoose.Types.ObjectId(_id)
       })
    }

    return res.status(200)
    .json(new ApiResponse(200,{Sucess:true}," status toggeled"))
    
})

const toggleCommentLike = asyncHandler(async (req, res) => {
    const {commentId} = req.params
    //TODO: toggle like on comment
    const _id=req.user?._id;
    if(!_id)
    {
        throw new ApiError(404,"Unauthourized acess")
    }
    if(!isValidObjectId(commentId)){
        throw new ApiError(404,"invalid videId")
    }

    const likeDoc=await Like.findByIdAndDelete(videoId)
    
    if(!likeDoc){
       await Like.create({
        comment:new mongoose.Types.ObjectId(commentId),
        like: new mongoose.Types.ObjectId(_id)
       })
    }

    return res.status(200)
    .json(new ApiResponse(200,{Sucess:true}," status toggeled"))
    

})

const toggleTweetLike = asyncHandler(async (req, res) => {
    const {tweetId} = req.params
    const _id=req.user?._id;
    if(!_id)
    {
        throw new ApiError(404,"Unauthourized acess")
    }
    if(!isValidObjectId(tweetId)){
        throw new ApiError(404,"invalid videId")
    }

    const likeDoc=await Like.findByIdAndDelete(tweetId)
    
    if(!likeDoc){
       await Like.create({
        tweet:new mongoose.Types.ObjectId(tweetId),
        like: new mongoose.Types.ObjectId(_id)
       })
    }

    return res.status(200)
    .json(new ApiResponse(200,{Sucess:true}," status toggeled"))
}
)

const getLikedVideos = asyncHandler(async (req, res) => {
    const _id=req.user?._id;
    if(!_id)
    {
        throw new ApiError(404,"Unauthourized acess")
    }
    if(!isValidObjectId(_id)){
        throw new ApiError(404,"invalid videId")
    }

    const likes = await Like.find({ likedBy: userId, video: { $exists: true } }).populate('video');
    
    const videos = likes.map(like => like.video);

    return res.status(200).json(new ApiResponse(200,videos,"all videos liked by user"))
})

export {
    toggleCommentLike,
    toggleTweetLike,
    toggleVideoLike,
    getLikedVideos
}