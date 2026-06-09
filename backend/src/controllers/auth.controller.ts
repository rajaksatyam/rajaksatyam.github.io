import { EnvConfig } from "../config/env.config.js";
import { type Auth } from "../validate/auth.validate.js";
import type { NextFunction, Request, Response } from "express";
import { genToken, RegisterUser, signInUser, tokenBlackListService } from "../service/auth.services.js";
import { logger } from "../utility/logger.utility.js";




const cookie = (res: Response, token: string) => {

  return res.cookie("token", token, {
    httpOnly: true,
    sameSite: "none",
    secure: true,
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
}





export const SignUpController = async (
  req: Request<{}, {}, Auth.SignUp>,
  res: Response,
  _next: NextFunction
) => {
  const user = await RegisterUser(req.body);
  cookie(res, user.token)

  return res.status(201).json({
    msg: "You are Register Successfully.",
    User: {userName: user.userName},
  });
}

export const SignInController = async (
  req: Request<{}, {}, Auth.SignIn>,
  res: Response,
  next: NextFunction
) => {

  const user = await signInUser(req.body);

  cookie(res, user.token)


  return res.status(200).json({
    msg: "User SignIn Sucessfully.",
    user: {
      userName: user.userName
    }
  })
};

export const signOutController = async (req: Request, res: Response) => {
  const token = req.cookies.token;
  if (token) {
    try {
      await tokenBlackListService(token);
    } catch (err) {
      logger.warn(err, "Failed to blacklist token during signout:");
    }
  }
  res.clearCookie("token");
  return res.status(200).json({
    msg: "LogOut Sucessfully"
  })
}

