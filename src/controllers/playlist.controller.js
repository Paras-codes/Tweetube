import mongoose, {Types, isValidObjectId} from "mongoose"
import {Playlist} from "../models/playlist.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import { Video } from "../models/video.model.js"
import { User } from "../models/user.model.js"


const createPlaylist = asyncHandler(async (req, res) => {
    const {name, description} = req.body
    const _id=req.user?._id;
    if(!_id){
        throw new ApiError(404,"unauthourized acess")
    }
    //Algo 
    //we have to gather user video 
    //matching with a particular description 
    //then create a document of playlist
    const userId=new Types.ObjectId(id);
    const video_doc=await Video.aggregate([
        {
            $match:{
                owner:userId
            }
        },
            {
                $match: {
                    $or: [
                        { title: { $regex: description, $options: 'i' } },//i for handing the case insenstivity
                        { description: { $regex: description, $options: 'i' } }
                    ]
                }
            }
    ])
    const playlist=await Playlist.create({
            name,
            description,
            videos:video_doc,
            owner:userId
            })

    return res.status(200).json(new ApiResponse(200,{success:true},"playlist created sucessfully"))

    //TODO: create playlist
})

const getUserPlaylists = asyncHandler(async (req, res) => {
    const {userId} = req.params
    if(!isValidObjectId(userId))
    {
        throw new ApiError(404,"invalid userId")
    }

    const user=await User.findById(userId);

    if(!user){
        throw new ApiError(404,"user not found")
    }
    const playlistDoc=await Playlist.aggregate([{
        $match:{
            owner:new Types.ObjectId(userId)
        }
    }])

   return res.status(200).json(new ApiResponse(200,playlistDoc,"all playlist of the user")) 
    //TODO: get user playlists
})

const getPlaylistById = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    if(!isValidObjectId(playlistId))
    {
        throw new ApiError(404,"invalid playlistId")
    }

    const playlistDoc=await Playlist.findById(playlistId)
    if(!playlistDoc){
        throw new ApiError(404,"Playlist not found")
    }

    return res.status(200).json(new ApiResponse(200,playlistDoc)) 
})

const addVideoToPlaylist = asyncHandler(async (req, res) => {
    const {playlistId, videoId} = req.params

    //search for playlist and videoid 
    //then add video_id from the the video 
    //save 
   
    if(!isValidObjectId(playlistId)||!isValidObjectId(videoId))
    {
        throw new ApiError(404,"invalid playlistId")
    }

    const playlistDoc=await Playlist.findById(playlistId)
    if(!playlistDoc){
        throw new ApiError(404,"Playlist not found")
    }
    const videoDoc=await Video.findById(videoId)
    if(!videoDoc){
        throw new ApiError(404,"videoDoc not found")
    }
    const videId=videoDoc._id;
    playlistDoc.playlist.push(videId);

    await playlistDoc.save()

    return res.status(200)
    .json(new ApiResponse(200,"video added to playlist sucessfully"))

})

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
    const {playlistId, videoId} = req.params
   if(!isValidObjectId(playlistId)||!isValidObjectId(videoId))
   {
    throw new ApiError(404,"invalid ids")
   }
   await Playlist.updateOne(
    { _id: playlistId },
    { $pull: { videos: videoId } }
)
 
return res.status(200).json(new ApiResponse(200,{sucess:true},"video deleted sucessfully"))
})

const deletePlaylist = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    if(!isValidObjectId(playlistId)||!isValidObjectId(videoId))
    {
     throw new ApiError(404,"invalid ids")
    }

    const playlist_doc=await Playlist.findByIdAndDelete(playlistId);

    if(!playlist_doc){
        throw new ApiError(404,"playlist not found")
    }
    return res.status(200).json(new ApiResponse(200,{sucess:true},"playlist  deleted sucessfully"))

   
})


const updatePlaylist = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    const {name, description} = req.body

    if(!isValidObjectId(playlistId))
    {
     throw new ApiError(404,"invalid ids")
    }

    const playlistDoc=await Playlist.findByIdAndUpdate(playlistId,{
        $set:{
                 name:name,
                 description:description
        }
    },{new:true})

    if(!playlistDoc){
        throw new ApiError(404,"playlist not found")
    }

    return res.status(200).json(new ApiResponse(200,playlistDoc,"playlist  updated sucessfully"))

})

export {
    createPlaylist,
    getUserPlaylists,
    getPlaylistById,
    addVideoToPlaylist,
    removeVideoFromPlaylist,
    deletePlaylist,
    updatePlaylist
}