// models/SubscriberMessage.js
import mongoose from "mongoose";

const subscriberMessageSchema = new mongoose.Schema(
    {
        subject: { type: String, required: true },
        html: { type: String, required: true },
        sentToCount: { type: Number, required: true },
    },
    { timestamps: true }
);

export default mongoose.model("SubscriberMessage", subscriberMessageSchema);
