import "dotenv/config"
import { z} from 'zod';



const configSchema = z.object({
    PORT:z.coerce.number().default(3000),
    MONGO_URI:z.string().min(1,"Mongo URI is missing."),
    JWT_SECRET:z.string().min(1,"JET_SECRET is missing."),
    NODE_ENV:z.enum(["development","production","test"]).default("development"),
    CLIENT_URI:z.string().min(1,"CLIENT_URI is missing."),
    ARGON2_PEPPER:z.string().min(1,"ARGON2_PEPPER is Missing."),
    GEMINI_KEY:z.string().min(1,"GEMINI_KEY is Missing."),
})

const parse = configSchema.safeParse(process.env);

if(!parse.success){
    console.error("Env Missconfigration.");
    parse.error.issues.forEach(issue=>{console.error(`path:${issue.path.join(".")} message:${issue.message}`)})
    process.exit(1);   
}
export const EnvConfig = parse.data;
export type EnvConfigSchema = z.infer<typeof configSchema>;
