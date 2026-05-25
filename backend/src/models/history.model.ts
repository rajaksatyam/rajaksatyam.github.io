import mongoose, { Document, Schema, model } from "mongoose";
import type { GeminiAnalysis } from "../service/summery.LLM.service.js";

export interface IHistory extends Document {
    userId: mongoose.Types.ObjectId;
    url: string;
    result: GeminiAnalysis;
    createdAt: Date;
    updatedAt: Date;
}

const historySchema = new Schema<IHistory>(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "user",
            required: true,
            index: true,
        },
        url: {
            type: String,
            required: true,
        },
        result: {
            type: mongoose.Schema.Types.Mixed,
            required: true,
        },
    },
    { timestamps: true }
);

export const historyModel = model<IHistory>("history", historySchema);