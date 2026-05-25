import type { Response, NextFunction } from "express";
import type { AuthRequest } from "../middleware/userVerification.middleware.js";
import type { JwtPayload } from "jsonwebtoken";
import {
    getHistoryService,
    deleteHistoryItemService,
    clearHistoryService,
} from "../service/history.service.js";
import { AppError } from "../errors/AppErrors.errors.js";


export const getHistoryController = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
) => {
    const userId = (req.user as JwtPayload).id as string;
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const data = await getHistoryService(userId, page);
    res.json({ success: true, ...data });
};


export const deleteHistoryItemController = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
) => {
    const userId = (req.user as JwtPayload).id as string;
    const { id } = req.params;
    if (!id || typeof id !== "string") {
        throw new AppError("Invalid or missing history item ID", 400);
    }
    const deleted = await deleteHistoryItemService(userId, id);
    if (!deleted) throw new AppError("History item not found", 404);
    res.json({ success: true });
};


export const clearHistoryController = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
) => {
    const userId = (req.user as JwtPayload).id as string;
    await clearHistoryService(userId);
    res.json({ success: true });
};