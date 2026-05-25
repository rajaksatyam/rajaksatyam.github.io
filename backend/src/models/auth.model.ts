import mongoose, {Document,Schema,model} from "mongoose";



export interface Iuser extends Document {
    userName:string;
    email:string;
    password:string;
    createdAt:Date;
    updatedAt:Date;

}

export interface IblackListToken extends Document {
    token:string;
    expiresAt:Date;
    createdAt:Date;
}

const userSchema = new Schema<Iuser>({
    email : {
        type:String,
        unique: true,
        required: [true,"Please provide the email."],
        lowercase:true,
        trim:true
    },
    userName: {
        type:String,
        unique:true,
        required: [true,"Please provide the UserName."],
        lowercase:true,
        trim:true
    },
    password:{
        type:String,
        required:[true,"Please provide the Password."],
        select:false
    }
    
},{
    timestamps:true
})

const tokenBlackListSchema = new Schema<IblackListToken>({
    token:{
        type:String,
        required:[true,"Token is required!"],
        unique:true,
        index:true
    },
    expiresAt:{
        type:Date,
        required:true,
        index:{expires:0}
    },
    
},{timestamps:true})

export const userModel = model<Iuser>("user",userSchema)
export const blackListModel = model<IblackListToken>("tokenBlackList",tokenBlackListSchema)

