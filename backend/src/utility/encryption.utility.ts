// import crypto from "node:crypto"
// import { EnvConfig } from "../config/env.config";
// import type { string } from "zod";
// import { AppError } from "../errors/AppErrors.errors";

// const ALGO = "aes-256-gcm";
// const KEY = Buffer.from(EnvConfig.INSTA_KEY);

// const encrypt = (data:string)=>{
//     const IV = Buffer.from(crypto.randomBytes(12));
//     const cipher = crypto.createCipheriv(ALGO,KEY,IV);
//     let encrypted = cipher.update(data,'utf-8','hex');
//     encrypted += cipher.final('hex');
//     const authTag = cipher.getAuthTag().toString("hex");
//     return `${IV.toString("hex")}:${authTag}:${encrypted}`
// }

// const decrypt = (data:string) =>{
//     const [HEXIV,authTag,encryptedData] = data.split(":");
//     if(!HEXIV || !authTag || !encryptedData){
//         throw new AppError("Somethingwent wrong",500)
//     }
//     const decipher = crypto.createDecipheriv(ALGO,KEY,HEXIV);
//     let decrypt = decipher.update(encryptedData,'utf-8','hex')
// }