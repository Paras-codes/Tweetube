import mongoose, {Types, isValidObjectId} from "mongoose"
import {Video} from "../models/video.model.js"
import {User} from "../models/user.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import {deleteFromCloudinary, uploadOnCloudinary} from "../utils/cloudinary.js"


const getAllVideos = asyncHandler(async (req, res) => {
    const { page = "1", limit = "10", query, sortBy="createdAt", sortType="desc", userId } = req.query
    const pageNumber = Number(page);
    const limitNumber = Number(limit);
   
    if(!userId){

    throw new ApiError(400,"All fields are required");

    }
    if(!isValidObjectId(userId)){
        throw new ApiError(404,"Invalid channel")
    }

    const user=User.findById(userId);
    if(!user){
        throw new ApiError(404,"User not found")
    }

    const sort=sortType==="aesc"?1:-1;
    let videos;

    if(!query||query?.trim()===""){
        videos=await Video.aggregate([
            {
                $match:{
                    owner:new Types.ObjectId(userId)
                }
            },
            {
                $sort: {
                    [sortBy]: sort //if you ever have to use string as a property than always use []on it 
                }
            },
            {
                $skip: (pageNumber - 1) * limitNumber // skip the documents of the previous pages
            },
            {
                $limit: limitNumber // limit the number of documents
            },
            
        ])
    }
    else
    {
    videos=Video.aggregate([
        {
            $match:{
                owner:new Types.ObjectId(userId)
            }
        },
        {
            $match: {
                $or: [
                    { title: { $regex: query, $options: 'i' } },//i for handing the case insenstivity
                    { description: { $regex: query, $options: 'i' } }
                ]
            }
        },
        {
            $sort: {
                [sortBy]: sort // sort by 'createdAt' in descending order
            }
        },
        {
            $skip: (pageNumber - 1) * limitNumber // skip the documents of the previous pages
        },
        {
            $limit: limitNumber // limit the number of documents
        },
        
    ])
}

return res
.status(200)
.json(new ApiResponse(200,videos,"All videos"))
   
})

const publishAVideo = asyncHandler(async (req, res) => {
    const { title, description} = req.body
    const id=req.user?._id;
    if(!id){
        throw new ApiError(404,"userid is required")
    }

    if(!isValidObjectId(id)){
        throw new ApiError(404,"Invalid channel")
    }
    const user=await User.findById(id);
    if(!user){
        throw new ApiError(404,"User not found")
    }
    
    const user_id=new Types.ObjectId(id);

    const thumbnailLocalPath=req.files?.thumbnail[0]?.path;
    if(!thumbnailLocalPath){
        throw new ApiError(404,"thumbnail is required")
    }
    const videoLocalPath=req.files?.video[0]?.path;
    if(!videoLocalPath){
        throw new ApiError(404,"video is required")
    }

    const thumbnail=await uploadOnCloudinary(thumbnailLocalPath);
    if(!thumbnail){
        throw new ApiError(404,"thumbnail not uploaded try again")
    }
    
    const video=await uploadOnCloudinary(videoLocalPath);

    if(!video){
        throw new ApiError(404,"video not uploaded try again")
    }
    
    const video_doc=await Video.create({
        videoFile:video.url,
        thumbnail:thumbnail.url,
        title:title,
        description:description,
        duration: video.duration,
        owner:user_id
 })

 const video_check=await Video.findById(video_doc._id)

 if(!video_check){
    throw new ApiError(404,"Something went wrong try again")
    }

 return res.status(200)
 .json(
    new ApiResponse( 200,
        video_doc,
        "video published sucessfully ")
        )   
})

const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params
   //if you are not logged in then also you can get the video 
   if(!isValidObjectId(videoId)){
       throw new ApiError(404,"Invalid videoid")
   }


    const video_doc=await Video.findById(videoId)

    if(!video_doc){
        throw new ApiError(404,"video not present")
    }

   return  res.status(200)
    .json(
    new ApiResponse( 200,
        video_doc,
        " Results")
        )   
})

const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    const {title, description, thumbnail}=req.body
    //you should we logged in for this 
    //TODO: update video details like title, description, thumbnail

    if(!isValidObjectId(videoId)){
        throw new ApiError(404,"invalid videId")
    }
    
    
        const video_doc=await Video.findByIdAndUpdate(videoId,
            {
                $set:{
                       title,
                       description
                },
                
        },
        {new:true}//it will return the updated user
        )
    if(!video_doc){
        throw new ApiError(404,"video not available")
  
    }
    if(req.files){
        const newThumbnailPath=req.files?.thumnail[0]?.path
        if(!newThumbnailPath){
            throw new ApiError(404,"path not found")
        }
        const oldThumbnailUrl=video_doc.thumbnail;
        const newThumbnailUrl=await uploadOnCloudinary(newThumbnailPath)
        if(!newThumbnailUrl){
            throw new ApiError(404,"thumbnail not upload try again")
        }
        video_doc.thumbnail=newThumbnailUrl.url;

        await video_doc.save()//whenever you have alrealy have a reference of the object and you have to reflect changes in actual database 
        
        const deleteOldthumbnail=deleteFromCloudinary(oldThumbnailUrl);
        
        if(deleteFromCloudinary instanceof Error){
            throw new ApiError(404,"cannot delete the thumbnail try again",deleteOldthumbnail)
        }
    }
    return  res.status(200)
    .json(
    new ApiResponse( 200,
        video_doc,
        " tittle and description updated sucessfully")
        )    
    }
 

)

const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: delete video
    if(!isValidObjectId(videoId)){
        throw new ApiError(404,"invalid videId")
    }
    
    const video_doc=await Video.findByIdAndDelete(videoId);
    

    if(!video_doc){
        throw new ApiError(404,"video not found")
    }

    const oldVideoUrl=video_doc.videoFile;

    const deleteOldVideo=deleteFromCloudinary(oldVideoUrl);
        
    if(deleteFromCloudinary instanceof Error){
        throw new ApiError(404,"cannot delete the video try again",deleteOldVideo);
    }


    return  res.status(200)
    .json(
    new ApiResponse( 200,
        " video deleted sucessfully ")
        )    
    
 
})

const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params

    if(!isValidObjectId(videoId)){
        throw new ApiError(404,"invalid videId")
    }

    const video_doc=await Video.findByIdAndUpdate(videoId,
        {
            $set:{
                isPublished:false
            },
            
    },
    {new:true}//it will return the updated user
    )
    
    if(!video_doc){
        throw new ApiError(404,"video not found");
    }

    return res.status(200)
    .json(new ApiResponse(200,{isPublished:false},"published status toggeled"))
    
})

export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus
}