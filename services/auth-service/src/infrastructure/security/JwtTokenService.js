const jwt = require("jsonwebtoken");

function createJwtTokenService({ secret, expiresIn }) {
  const jwtSecret = secret || process.env.JWT_SECRET;
  if (!jwtSecret) {
    throw new Error("JWT_SECRET is not configured.");
  }

  return {
    sign(claims) {
      return jwt.sign(claims, jwtSecret, { expiresIn: expiresIn || "7d" });
    },
    verify(token) {
      return jwt.verify(token, jwtSecret);
    },
  };
}

module.exports = { createJwtTokenService };

