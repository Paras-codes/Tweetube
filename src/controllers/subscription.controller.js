import mongoose, {Types, isValidObjectId} from "mongoose"
import { Subscription } from "../models/subscription.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"


const toggleSubscription = asyncHandler(async (req, res) => {
    const {channelId} = req.params
   
    if(!isValidObjectId(channelId)){
        throw new ApiError(400,"Invalid channel")
    }

    const user= await Subscription.findOne({
        subscriber:new Types.ObjectId(req.user?.id),
        channel:new Types.ObjectId(channelId)
    })

    if(user){
      await Subscription.findByIdAndDelete(req.user?._id)
      res
      .status(200)
      .json(new ApiResponse(
          200,
          {subscribed:false},
          "unsubscribed sucessfully"
          )
          )
    }


    await Subscription.create({
        subscriber:new Types.ObjectId(req.user?.id),
        channel:new Types.ObjectId(channelId)
    })

    return res
    .status(200)
    .json(new ApiResponse(
        200,
        {subscribed:true},
        "subscribed sucessfully"
        )
        )




})

// controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
    const {channelId} = req.params
    
    if(!isValidObjectId(channelId)){
        throw new ApiError(400,"Invalid channel")
    }

    const subscribers=await Subscription.aggregate([
        {
            $match:{
                channel:new Types.ObjectId(channelId)
            }
        },
        {
            $lookup:{
                from:"users",
                localField:"subscriber",
                foreignField:"_id",
                as:"subscriber",
                pipeline:[
                    {
                        $project:{
                            username:1,
                            fullname:1,
                            avatar:1
                        }
                    }
                ]
            }
        },
        {
            $addFields:{
            subscriber:{
                $first:"$subscriber"
            }
            }
        },
        {
            $project:{
                subscriber:1
            }
        }
    ])

    return res
    .status(200)
    .json(new ApiResponse(
        200,
        subscribers,
        "list of all subscribers"
        )
        )

})

// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
    const { subscriberId } = req.params

       
    if(!isValidObjectId(channelId)){
        throw new ApiError(400,"Invalid channel")
    }

    const subscribedTo=await Subscription.aggregate([
        {
            $match:{
                subscriber:new Types.ObjectId(subscriberId)
            }
        },
        {
            $lookup:{
                from:"users",
                localField:"channel",
                foreignField:"_id",
                as:"channel",
                pipeline:[
                    {
                        $project:{
                            username:1,
                            fullname:1,
                            avatar:1
                        }
                    }
                ]
            }
        },
        {
            $addFields:{
            channel:{
                $first:"$channel"
            }
            }
        },
        {
            $project:{
                channel:1
            }
        }
    ])

    return res
    .status(200)
    .json(new ApiResponse(
        200,
        subscribedTo,
        "list of all channels subscribed"
        )
        )

})

export {
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannels
}