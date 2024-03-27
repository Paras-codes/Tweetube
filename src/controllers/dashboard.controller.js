import mongoose from "mongoose"
import {Video} from "../models/video.model.js"
import {Subscription} from "../models/subscription.model.js"
import {Like} from "../models/like.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const getChannelStats = asyncHandler(async (req, res) => {
    // TODO: Get the channel stats like total video views, total subscribers, total videos, total likes etc.
    const channelId= req.user?._id 
    if(!channelId){
        throw new ApiError(400,"Unauthourized acess");
    }
    const totalViews = await Video.aggregate([
        { $match: { channel: new mongoose.Types.ObjectId(channelId) } },
        { $group: { _id: null, totalViews: { $sum: '$views' } } }
    ]);
    const totalSubscribers=await Subscription.countDocuments({ channel:new mongoose.Types.ObjectId(channelId) });
    const videos=await Video.find({owner:new mongoose.Types.ObjectId(channelId)});
    const videoIds = videos.map(video => video._id);
    const totalVideo=videos.length;
    const totalLike= await Like.aggregate([
        { $match: { 
            video: { 
                $exists: true, 
                $ne: null }
             } 
        },
        { 
          $match:{  video: {
                 $in: videoIds 
                } 
            }
        }

    ]);
   const likecount=totalLike.length;
   
   const channelStats={
    totalViews:totalViews[0].totalViews,
    totalSubscribers:totalSubscribers,
    totalVideo:totalVideo,
    totalLike:likecount
   }

   return res.status(200).json(new ApiResponse(200,channelStats," channel dashboard "))

})

const getChannelVideos = asyncHandler(async (req, res) => {
    // TODO: Get all the videos uploaded by the channel
    const channelId= req.user?._id 
    if(!channelId){
        throw new ApiError(400,"Unauthourized acess");
    }

    const videos=await Video.find({owner:new mongoose.Types.ObjectId(channelId)});
    if(videos.length===0)
   {
    return res.status(200).json(200,{success:true},"no video uploaded");
   }
   return res.status(200).json(200,videos,"All videos");
})

export {
    getChannelStats, 
    getChannelVideos
    }