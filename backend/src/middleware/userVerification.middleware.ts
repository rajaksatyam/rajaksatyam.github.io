import type { Request, Response, NextFunction } from "express"
import JWT from "jsonwebtoken"
import { EnvConfig } from "../config/env.config.js";
import { AppError } from "../errors/AppErrors.errors.js";
import { blackListedTokenFinderRepo } from "../repository/auth.repo.js";


export interface AuthRequest extends Request {
    user?: string | JWT.JwtPayload;
}



export const verifyUser = async (req: AuthRequest, _res: Response, next: NextFunction) => {
    const token = req.cookies.token;
    console.log(token)
    if (!token) throw new AppError("Unauthrize Access", 401);

    const tokenBlackListed = await blackListedTokenFinderRepo(token);
    if (tokenBlackListed) throw new AppError("Unauthrize Access", 401)

    const verifyToken = JWT.verify(token, EnvConfig.JWT_SECRET);
    req.user = verifyToken
    next();

}