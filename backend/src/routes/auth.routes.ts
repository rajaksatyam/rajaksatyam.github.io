import { Router } from "express";
import { SignUpController, SignInController, signOutController, refreshController } from "../controllers/auth.controller.js";
import { AuthSchema } from "../validate/auth.validate.js";
import { validate } from "../middleware/validate.middleware.js";
import { verifyUser } from "../middleware/userVerification.middleware.js";
import { authRateLimit } from "../middleware/ratelimiter.middleware.js";


const authRouter = Router();

authRouter.post('/signUp',authRateLimit ,validate(AuthSchema.signUp),SignUpController);
authRouter.post('/signIn', authRateLimit,validate(AuthSchema.signIn),SignInController);;
authRouter.get('/signOut',signOutController);
authRouter.post('/refresh',verifyUser,refreshController);



export default authRouter;