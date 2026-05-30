
import type { Response, NextFunction } from "express";
import type { AuthRequest } from "../middleware/userVerification.middleware.js";
import type { JwtPayload } from "jsonwebtoken";
import { download } from "../service/ydl.service.js";
import { saveHistoryService } from "../service/history.service.js";
import { logger } from "../utility/logger.utility.js";

export const contentAnalisisController = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
) => {
    const userId = (req.user as JwtPayload).id as string;
    const { url } = req.body;

    const data = await download(url);


    saveHistoryService(userId, url, data).catch((err) =>
        logger.error(err,"History save failed:")
    );

    res.json({ success: true, data });
};