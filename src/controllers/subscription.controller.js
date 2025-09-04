import mongoose, {Types, isValidObjectId} from "mongoose"
import { Subscription } from "../models/subscription.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import { User } from "../models/user.model.js"
import  {razorpay} from "../utils/razorpay.js"


const razorpayWebhookHandler = asyncHandler(async (req, res) => {
  try {
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET;

    // Compute HMAC from raw body
    const shasum = crypto.createHmac("sha256", secret);
    shasum.update(req.body);
    const digest = shasum.digest("hex");

    const signature = req.headers["x-razorpay-signature"];

    if (digest === signature) {
      // Parse raw body only AFTER verifying signature
      const event = JSON.parse(req.body.toString());
      console.log("✅ Verified webhook event:", event.event);

      if (event.event === "payment.captured") {
        const payment = event.payload.payment.entity;

        // retrieve notes
        const subscriberId = payment.notes.subscriber;
        const channelId = payment.notes.channel;
        const email = payment.email || payment.contact;

        console.log(
          "Payment captured for subscriber:",
          subscriberId,
          "channel:",
          channelId,
          "email:",
          email
        );
 if (!subscriberId || !channelId) {
        throw new ApiError(400, "Subscriber and channel are required");
    }
    const subscribedUser=await User.findOne({subscriberId})
    const subscribedChannel=await User.findOne({channelId})
    subscribedUser.exclusivemembership.push(subscribedChannel._id)   
    await subscribedUser.save();
    subscribedChannel.exclusivemembers.push(subscribedUser._id);
    await subscribedChannel.save();
    res.status(200).json(new ApiResponse(200, { subscribed: true }, "membership activated"));
        // Example: activate subscriber membership
        
      }

      return res.json({ status: "ok" });
    } else {
      console.log("❌ Invalid signature");
      return res.status(400).send("Invalid signature");
    }
  } catch (error) {
    console.error("⚠️ Webhook error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});
const addPrimeMembership = asyncHandler(async (req, res) => {
try{
  const { subscriber, channel } = req.body;
    if (!subscriber || !channel) {
        throw new ApiError(400, "Subscriber and channel are required");
    }
    const subscribedUser=await User.findOne({subscriber})
    const subscribedChannel=await User.findOne({channel})
    subscribedUser.exclusivemembership=new mongoose.Types.ObjectId(subscribedChannel._id);
    await subscribedUser.save();
    subscribedChannel.exclusivemembers=new mongoose.Types.ObjectId(subscribedUser._id);
    await subscribedChannel.save();
    res.status(200).json(new ApiResponse(200, { subscribed: true }, "membership activated"));
}
catch(err){
    throw new ApiError(500, [err]);
}

});

const createPrimeSubscription=asyncHandler(async (req, res)=>{
// Assuming you have User model and Subscription model imported

const { plan_id, customer_notify = 1, total_count = 1, username } = req.body;
const channel = await User.findOne({username}); 
if(!plan_id)
{
    throw new ApiError(400,"plan id is required");
}
if(!channel) {
     throw new ApiError(400,"channel not found");
}

const isSubscribed = await Subscription.findOne({
  subscriber: new mongoose.Types.ObjectId(req.user?._id),
  channel: new mongoose.Types.ObjectId(channel._id)
});

if (!isSubscribed) {
    await Subscription.create({
        subscriber:new mongoose.Types.ObjectId(req.user?._id),
        channel:new mongoose.Types.ObjectId(channel._id)
    }) 
} 
try{
const subscription = await razorpay.subscriptions.create({
      plan_id,
      total_count,
      customer_notify: 1,  // ✅ Razorpay will email the link to the customer
      customer: {
        email: req.user?.email,       // email of your logged-in user
        contact: req.user?.phone || "" // optional but recommended
      },
      notes: {
        subscriber: req.user?._id,
        channel: channel._id,
        project: `applying for the membership of ${username}`
      }
})
 return res.status(201).json(
        new ApiResponse(200,subscription, "subscription created successfully")
    )

}
catch(err){
    throw new ApiError(500,["Razorpay error",err])
}
})
const toggleSubscription = asyncHandler(async (req, res) => {
    //need to be logged in 
    const {channelId} = req.params
    console.log(channelId);
   
    if(!isValidObjectId(channelId)){
        throw new ApiError(400,"Invalid channel")
    }

    const user= await Subscription.findOne({
        subscriber:new mongoose.Types.ObjectId(req.user?.id),
        channel:new mongoose.Types.ObjectId(channelId)
    })

    if(user){
    //   await Subscription.findOneAndDelete(  
    //      {
    //         subscriber:new mongoose.Types.ObjectId(req.user?.id),
    //         channel:new mongoose.Types.ObjectId(channelId)
    //     })
   await user.deleteOne()
      return  res
      .status(200)
      .json(new ApiResponse(
          200,
          {subscribed:false},
          "unsubscribed sucessfully"
          )
          )
    }


    await Subscription.create({
        subscriber:new mongoose.Types.ObjectId(req.user?.id),
        channel:new mongoose.Types.ObjectId(channelId)
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
    console.log(req.user);
    const channelId = req.user._id;
    console.log(channelId);
    
    if(!isValidObjectId(channelId)){
        throw new ApiError(400,"Invalid channel")
    }

    const subscribers=await Subscription.aggregate([
        {
            $match:{
                channel:new mongoose.Types.ObjectId(channelId)
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
    const  subscriberId  = req.user?._id

       
    if(!isValidObjectId(subscriberId)){
        throw new ApiError(400,"Invalid channel")
    }

    const subscribedTo=await Subscription.aggregate([
        {
            $match:{
                subscriber:new mongoose.Types.ObjectId(subscriberId)
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
    getSubscribedChannels,
    createPrimeSubscription,
    addPrimeMembership,
    razorpayWebhookHandler
}