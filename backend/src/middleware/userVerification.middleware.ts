import type { Request, Response, NextFunction } from "express"
import JWT from "jsonwebtoken"
import { EnvConfig } from "../config/env.config";
import { AppError } from "../errors/AppErrors.errors";
import { blackListedTokenFinderRepo } from "../repository/auth.repo";

export interface AuthRequest extends Request {
    user?: string | JWT.JwtPayload;
}

export const verifyUser = async (req: AuthRequest, res: Response, next: NextFunction) => {
    const token = req.cookies.token

    if (!token) return next(new AppError("Unauthrize Access", 401));

    const tokenBlackListed = await blackListedTokenFinderRepo(token);
    if (tokenBlackListed) throw new AppError("Unauthrize Access", 401)

    const verifyToken = JWT.verify(token, EnvConfig.JWT_SECRET);
    req.user = verifyToken
    next()

}