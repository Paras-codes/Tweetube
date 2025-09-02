import mongoose from "mongoose";

const txSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },// if tied to a resource
  planid: string ,  // razorpay order id (order_Exxx)
  paymentId: String, // razorpay payment id (pay_Exxx)// in paise
  status: String,    // created / paid / failed / refunded
}, { timestamps: true });

export const  Transaction= mongoose.model("Transaction", txSchema);
