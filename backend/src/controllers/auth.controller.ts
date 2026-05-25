


import { EnvConfig } from "../config/env.config.js";
import { type Auth } from "../validate/auth.validate.js";
import type { NextFunction, Request, Response } from "express";
import { RegisterUser,signInUser,tokenBlackListService } from "../service/auth.services.js";
import { AppError } from "../errors/AppErrors.errors.js";



const cookie = (res:Response ,token:string)=>{
    return res.cookie("token", token,{
        httpOnly:true,
        sameSite:"strict",
        secure: EnvConfig.NODE_ENV === "production",
        maxAge: 15 * 60 * 1000

    });
} 





export const SignUpController =  async (
  req: Request<{}, {}, Auth.SignUp>,
  res: Response, next:NextFunction
) => {
    const user = await RegisterUser(req.body);
    if(user === "user Already Exists.") return res.status(401).json({msg:user});


    cookie(res,user.token)

    return res.status(201).json({
      msg: "You are Register Successfully.",
      User: {
        userName: user.userName,
      },
    });
  } 

export const SignInController = async (
  req: Request<{}, {}, Auth.SignIn>,
  res: Response,
) => {

  const user = await signInUser(req.body);

  cookie(res,user.token)

  return res.status(200).json({
    msg:"User SignIn Sucessfully.",
    user:{
      userName:user.userName
    }
  })


};

export const signOutController = async(req:Request,res:Response)=>{
  const blackListToken = await tokenBlackListService(req.cookies.token)
  if(!blackListToken) throw new AppError("Cookies not found",401)
  res.clearCookie("token");
  return res.status(200).json({
    msg:"LogOut Sucessfully"
  })
}
