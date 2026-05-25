import type{Request,Response,NextFunction} from "express"
import { EnvConfig } from "../config/env.config"
import { logger } from "../utility/logger.utility"
import { AppError } from "../errors/AppErrors.errors"



export const globalErrors = (
  err:unknown,
  req:Request,
  res:Response,
  next:NextFunction
): void=>{


  logger.error({
    err,
    path:req.path,
    method:req.method
  })

  if(err instanceof AppError){
    res.status(err.statusCode).json({
      success:false,
      message: err.message,
      ...(EnvConfig.NODE_ENV==="development" && {stack:err.stack})
    });
    return
  }

  if(typeof err === "object"&&
    err !== null &&
    "code" in err &&
    (err as {"code":number}).code === 11000 &&
    "keyValue" in err
  ){
    const field = Object.keys((err as {keyValue:object}).keyValue)[0];
    res.status(409).json({
      success: false,
      message: `An account with that ${field} already exists.`
    });
return;
  }

  if( typeof err==="object"&&
    err !==null &&
    "name" in err &&
    (err as {name:string}).name === "CastError" &&
    "path" in err
  ){
    res.status(400).json({
            success: false,
      message: `Invalid value for field: ${(err as { path: string }).path}`
    })
    return;
  }

  if(
    typeof err === "object" &&
    err !== null &&
    "name" in err &&
    (err as {name:string}).name === "JsonWebTokenError"
  ){

    res.status(401).json({
      success:false,
      message:"Invalid token."
    });
    return 
  }

  if(typeof err === "object" &&
    err !== null &&
    "name" in err &&
    (err as {name:string}).name === "TokenExpiredError"
  ){
    res.status(401).json({
      success:false,
      message:"Token expired."
    });
    return
  }

res.status(500).json({
  success:false,
  message:"Internal Server Error",
  ...(EnvConfig.NODE_ENV === "development" && err instanceof Error && {stack:err.stack})
})
}

export const notFoundError = (req:Request,_res:Response,next:NextFunction):void=>{
  next(new AppError(`Route ${req.originalUrl} Page not Found`,404))
}
