


import { Router } from "express";
import { contentAnalisisController } from "../controllers/app.controller.js";
import { getHistoryController, deleteHistoryItemController, clearHistoryController, } from "../controllers/history.controller.js";
import { verifyUser } from "../middleware/userVerification.middleware.js";
import { validate } from "../middleware/validate.middleware.js";
import { AnalyzeSchema } from "../validate/app.validate.js";

export const appRouter = Router();


appRouter.post("/analyze", verifyUser, validate(AnalyzeSchema), contentAnalisisController);

appRouter.get("/history", verifyUser, getHistoryController);
appRouter.delete("/history/:id", verifyUser, deleteHistoryItemController);
appRouter.delete("/history", verifyUser, clearHistoryController);