import pino, { type LoggerOptions } from "pino";
import { EnvConfig } from "../config/env.config";


const pinoOptions: LoggerOptions = {
  level: EnvConfig.NODE_ENV === "production" ? "info" : EnvConfig.NODE_ENV === "development" ? "debug" : "silent",

  serializers: {
    error: pino.stdSerializers.err,
    err: pino.stdSerializers.err
  },
  redact: {
    paths: ['password', 'token', 'user.email', 'headers.authorization'],
    censor: '**REDACT**'
  }
}

if (EnvConfig.NODE_ENV === "development") {
  pinoOptions.transport = {
    target: "pino-pretty",
    options: {
      colorize: true,
      colorizeObjects: true,
      levelFirst: true,
      translateTime: "yyyy-mm-dd HH:MM:ss",
    }
  }
}

export const logger = pino(pinoOptions);
