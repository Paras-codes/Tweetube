import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { getSubscribedChannels, getUserChannelSubscribers, toggleSubscription,createPrimeSubscription } from "../controllers/subscription.controller.js";


const router=Router()

router.route("/subscribe/:channelId").post(verifyJWT,toggleSubscription)
router.route("/getsubscribedchannel").get(verifyJWT, getSubscribedChannels)
router.route("/getsubsciber").get(verifyJWT, getUserChannelSubscribers)
router.route("/primeSubscription").post(verifyJWT, createPrimeSubscription)

export default router;