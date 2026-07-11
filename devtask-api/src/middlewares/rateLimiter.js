const { tryCatch } = require('bullmq');
const {RateLimiterMemory} = require('rate-limiter-flexible');

// Auth rate limiter - stricter (login/register)
const authLimiter = new RateLimiterMemory({
    points: 10,  // 10 requests
    duration: 60, // per 60 seconds
})

// General API rate limiter

const apiLimiter = new RateLimiterMemory({
    points: 100, // 100 requests
    duration: 60, // per 60 seconds
})

const createRateLimitMiddleware = (limiter) => {
    return async (req, res, next) => {
        try{
            await limiter.consume(req.ip);
            next();
        }
        catch {
            res.status(429).json({
                'message': 'TOO many requests. Please try again later.',
            })
        }
    }
}

module.exports= {
    authLimiter = createRateLimitMiddleware(authLimiter),
    apiLimiter = createRateLimitMiddleware(apiLimiter),
}