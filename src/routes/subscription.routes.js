import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { getSubscribedChannels, getUserChannelSubscribers, toggleSubscription,createPrimeSubscription, addPrimeMembership, razorpayWebhookHandler } from "../controllers/subscription.controller.js";
import { verifyPayments } from "../middlewares/verifypayments.middleware.js";
import express from "express"

const router=Router()

router.route("/subscribe/:channelId").post(verifyJWT,toggleSubscription)
router.route("/getsubscribedchannel").get(verifyJWT, getSubscribedChannels)
router.route("/getsubsciber").get(verifyJWT, getUserChannelSubscribers)
router.route("/primeSubscription").post(verifyJWT, createPrimeSubscription)
router.route("/verifyPayment").post(verifyJWT,verifyPayments,addPrimeMembership)
router.route("/razorpay/webhook").post(
  express.raw({ type: "*/*" }),
  razorpayWebhookHandler
);
export default router;