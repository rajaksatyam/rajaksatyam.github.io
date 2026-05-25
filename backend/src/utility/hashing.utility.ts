import {type Algorithm, hash,verify,type Options} from "@node-rs/argon2"
import { EnvConfig } from "../config/env.config"
import { createHmac } from "crypto"

const argon2_Options:Options = {
    algorithm: 2,
    memoryCost: 64 * 1024,
    timeCost:3,
    parallelism:4
}

const applyPepper = (password:string)=>{
    return createHmac("sha256",Buffer.from(EnvConfig.ARGON2_PEPPER!)).update(password).digest("hex")
}

export const hashPassword = async (password:string): Promise<string> =>{
    const peppered = applyPepper(password);
    return hash(peppered,argon2_Options)
}

export const verifyPassword = async(password:string, storedHashedPassword:string): Promise<boolean> => {
    const userPasswordHasingToVerify = applyPepper(password);
    return await verify(storedHashedPassword,userPasswordHasingToVerify,argon2_Options)
}