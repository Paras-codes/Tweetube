import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
export const verifyPayments= asyncHandler( async(req,_,next ) => {
  try {
    const { razorpay_payment_id, razorpay_subscription_id, razorpay_signature } = req.body;

    const sign = razorpay_payment_id + "|" + razorpay_subscription_id;
    const expectedSign =  await crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(sign.toString())
      .digest("hex");

    if (razorpay_signature === expectedSign) {
        next();
    } else {
        throw new ApiError(400, ["Invalid signature sent!"]);
    }
   
  } catch (err) {
   throw new ApiError(500, ["Payment verification failed", err]);
  }


});
