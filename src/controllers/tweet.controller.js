import mongoose, { Types, isValidObjectId } from "mongoose"
import {Tweet} from "../models/tweet.model.js"
import {User} from "../models/user.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const createTweet = asyncHandler(async (req, res) => {
    //those who are logged in can only create an tweet

    const {content}=req.body
    const _id=req.user?._id

    if(!isValidObjectId(_id))
    {
        throw new ApiError(404,"invalid Id")
    }

    const tweetDoc=await Tweet.create({
        content:content,
        owner:new Types.ObjectId(_id)
    })

    return res.status(200).json(new ApiResponse(200,tweetDoc,"Tweet published sucessfully"))
})

const getUserTweets = asyncHandler(async (req, res) => {
    // TODO: get user tweets
    const _id=req.user?._id
    if(!_id){
        throw new ApiError(404,"Umauthourized Acess")
    }

    const tweetDoc=await Tweet.aggregate({
        $match:{
            owner:new Types.ObjectId(_id)
        }
        
    },
    {
        $project:{
            content:1
        }
    })

    return res.status(200).json(new ApiResponse(200,tweetDoc,"All Tweets"))

})

const updateTweet = asyncHandler(async (req, res) => {
        //TODO: update tweet
        //only loggedin ones can update 
        const {tweetId}=req.params;
        const {content}=req.body;
    
        if(!isValidObjectId(tweetId)){
            throw new ApiError(404,"invalid Id")
        }
    
        const tweetDoc=await Comment.findByIdAndUpdate(tweetId,{
            $set:{
                content:content
            }
        },{new:true}).select("-owner")
    
        if(!tweetDoc){
            throw new ApiError(404,"comment not found")
        }
    
        return res.status(200).json(new ApiResponse(200,tweetDoctDoc,"tweet updated  succesfully"))
})

const deleteTweet = asyncHandler(async (req, res) => {
    //TODO: delete tweet
     const {tweetId}=req.params;
    if(!isValidObjectId(tweetId)){
        throw new ApiError(404,"invalid Id")
    }

    const tweetDoc=await Comment.findByIdAndDelete(tweetId);

    if(!tweetDoc){
        throw new ApiError(400,"tweet not found /deleted Try again")
    }

    return res.status(200).json(new ApiResponse(200,{Sucess:true},"tweet deleted  succesfully"))
})

export {
    createTweet,
    getUserTweets,
    updateTweet,
    deleteTweet
}