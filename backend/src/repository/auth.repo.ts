
import { userModel, blackListModel, type Iuser, type IblackListToken } from "../models/auth.model"



export const findUser = async(userName:string,isPassword?:boolean)=>{

    const quary = userModel.findOne({userName});

    return isPassword ? await quary.select("+password") : await quary
    
}

export const createUser = async (userData:Partial<Iuser>):Promise<Iuser>=>{
    return await userModel.create(userData);
    
}

export const tokenBlackListRepo = async (tokenData:Partial<IblackListToken>)=>{
    return await blackListModel.create(tokenData);
}

export const blackListedTokenFinderRepo = async(token:string)=>{
    return blackListModel.findOne({token})
}


