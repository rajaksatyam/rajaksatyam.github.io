import rateLimit from "express-rate-limit";

export const authRateLimit = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 5,
    message: {
        error: "Too Many attempts",
        msg: "Too many attempts login/signup. Please try again after 15 Minuts "
    },
    legacyHeaders: false,
    standardHeaders: true,
    skipSuccessfulRequests: false
})

export const gernalRateLimiter = rateLimit({
    windowMs: 60 * 1000,
    limit: 60,
    message: {
        error: "Too many requests.",
        msg: "Please slow down a bit."
    },
    legacyHeaders: false,
    standardHeaders: true
})