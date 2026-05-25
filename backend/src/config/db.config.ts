import mongoose from "mongoose";
import { EnvConfig } from "./env.config";
const connectToDB = async()=>{
    try{
        if(!EnvConfig.MONGO_URI){
            throw new Error("The DB URI is missing from .env");
        }
        await mongoose.connect(EnvConfig.MONGO_URI);
        console.log("The App is sucessfully connected to the DB.");
    }
    catch(err){
        console.error("The DB connection Fail",err);
        process.exit(1);
    }
}

export default connectToDB;