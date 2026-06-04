
import express from "express";
import type { Application, Request, Response } from "express";
import {gernalRateLimiter } from "./middleware/ratelimiter.middleware.js";
import { logger } from "./utility/logger.utility.js";
import PinoHttp from "pino-http";
import cookie from "cookie-parser";
import helmet from "helmet";
import cors from "cors";


import authRouter from "./routes/auth.routes.js";
import { appRouter } from "./routes/app.routes.js";
import { globalErrors, notFoundError } from "./middleware/errorHandle.middleware.js";
import { EnvConfig } from "./config/env.config.js";

const app: Application = express();
app.set('trust proxy',1)
app.use(helmet());
app.use(PinoHttp({
  logger,
  serializers: {
    req: (req) => ({
      id: req.id,
      method: req.method,
      url: req.url,
      remoteAddress: req.remoteAddress,
      userAgent: req.headers?.['user-agent'],
    }),
    res: (res) => ({
      statusCode: res.statusCode,
    }),
  }
}))
app.use(express.json({ limit: '10kb' }));
app.use(cookie());
app.use(cors({ origin: 'https://d236n8rn53bkth.cloudfront.net', credentials: true }))
app.use(gernalRateLimiter)


app.use('/api/auth', authRouter)
app.use('/api', appRouter)
app.use(notFoundError)
app.use(globalErrors)


export default app