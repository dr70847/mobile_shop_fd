const rateLimit = require("express-rate-limit");

const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 120,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: {
    message: "Too many requests. Please try again later.",
  },
});

module.exports = { apiLimiter };
