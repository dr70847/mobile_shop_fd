const jwt = require("jsonwebtoken");

function requireAuth(req, res, next) {
  const header = req.headers.authorization || "";
  const [type, token] = header.split(" ");
  if (type !== "Bearer" || !token) return res.status(401).json({ message: "Missing auth token." });
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    return next();
  } catch {
    return res.status(401).json({ message: "Invalid or expired token." });
  }
}

function requireAdmin(req, res, next) {
  if (!req.user || (req.user.is_admin !== true && req.user.is_admin !== 1)) {
    return res.status(403).json({ message: "Admin access required." });
  }
  return next();
}

module.exports = { requireAuth, requireAdmin };
