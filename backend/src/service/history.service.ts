import { historyModel } from "../models/history.model.js";
import type { Analysis } from "./summery.LLM.service.js";

const LIMIT = 10;


export const saveHistoryService = async (
    userId: string,
    url: string,
    result: Analysis
) => {
    return await historyModel.create({ userId, url, result });
};


export const getHistoryService = async (userId: string, page: number) => {
    const skip = (page - 1) * LIMIT;

    const [items, total] = await Promise.all([
        historyModel
            .find({ userId })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(LIMIT)
            .lean(),
        historyModel.countDocuments({ userId }),
    ]);

    return {
        items,
        page,
        limit: LIMIT,
        total,
        hasMore: skip + items.length < total,
    };
};


export const deleteHistoryItemService = async (
    userId: string,
    historyId: string
) => {
    return await historyModel.findOneAndDelete({ _id: historyId, userId });
};


export const clearHistoryService = async (userId: string) => {
    return await historyModel.deleteMany({ userId });
};