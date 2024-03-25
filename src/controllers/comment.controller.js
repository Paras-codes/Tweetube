import mongoose, { isValidObjectId } from "mongoose"
import {Comment} from "../models/comment.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const getVideoComments = asyncHandler(async (req, res) => {
    //TODO: get all comments for a video
    const {videoId} = req.params
    const {page = 1, limit = 10} = req.query
    pageNumber=Number(page)
    limitNumber=Number(limit)

    if(!isValidObjectId(videoId)){
        throw new ApiError(404,"Invalid videoId")
    }
    
    const commentDoc=await Comment.aggregate([
        {
            $match:{
                video:new mongoose.Types.ObjectId(videoId)
            }
        },
        {
            $skip: (pageNumber - 1) * limitNumber // skip the documents of the previous pages
        },
        {
            $limit: limitNumber // limit the number of documents
        },
        {
            $project:{
                content:1
            }
        }
    ])

    if(commentDoc.length===0){
        throw new ApiError(400,"video not found")
    }

    return res.status(200).json(new ApiResponse(200,commentDoc,"comment retrived sucessfully"))
})

const addComment = asyncHandler(async (req, res) => {
    // TODO: add a comment to a video
    //user can only add comment when he or she is longged in 
    const {videoId}=req.params;
    const {content}=req.body;
    const _id=req.user?._id;

    if(!isValidObjectId(videoId)||!isValidObjectId(_id))
    {
        throw new ApiError(400," Id's are not valid")
    }

 const commentDoc= await Comment.create({
    content:content,
    video:new mongoose.Types.ObjectId(videoId),
    owner:new mongoose.Types.ObjectId(_id)
  })

  const check=await Comment.findById(commentDoc._id)

  if(!check){
    throw new ApiError(400, "comment not uploaded Try again")
  }

  return res.status(200).json(new ApiResponse(200,commentDoc,"comment added succesfully"))
})

const updateComment = asyncHandler(async (req, res) => {
    // TODO: update a comment
    const {commentId}=req.params;
    const {content}=req.body;

    if(!isValidObjectId(commentId)){
        throw new ApiError(404,"invalid Id")
    }

    const commentDoc=await Comment.findByIdAndUpdate(commentId,{
        $set:{
            content:content
        }
    },{new:true}).select("-owner -video")

    if(!commentDoc){
        throw new ApiError(404,"comment not found")
    }

    return res.status(200).json(new ApiResponse(200,commentDoc,"comment updated  succesfully"))
})

const deleteComment = asyncHandler(async (req, res) => {
    const {commentId}=req.params;
    if(!isValidObjectId(commentId)){
        throw new ApiError(404,"invalid Id")
    }

    const commentDoc=await Comment.findByIdAndDelete(commentId);

    if(!commentDoc){
        throw new ApiError(400,"Comment not found /deleted Try again")
    }

    return res.status(200).json(new ApiResponse(200,{Sucess:true},"comment deleted  succesfully"))
})

export {
    getVideoComments, 
    addComment, 
    updateComment,
     deleteComment
    }