import mongoose from "mongoose";
import { EnvConfig } from "./env.config";
import { logger } from "../utility/logger.utility";
const connectToDB = async()=>{
    try{
        if(!EnvConfig.MONGO_URI){
            throw new Error("The DB URI is missing from .env");
        }
        await mongoose.connect(EnvConfig.MONGO_URI);
        logger.info("The App is sucessfully connected to the DB.");
    }
    catch(err){
        logger.error(err,"The DB connection Fail");
        process.exit(1);
    }
}

export default connectToDB;