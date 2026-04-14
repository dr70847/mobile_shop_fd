const express = require("express");
const orderService = require("../business/orderService");
const { requireAuth } = require("./authMiddleware");

const router = express.Router();

router.get("/", async (_req, res) => {
  try {
    return res.json(await orderService.listOrders());
  } catch {
    return res.status(500).json({ message: "Database error." });
  }
});

router.get("/my", requireAuth, async (req, res) => {
  try {
    return res.json(await orderService.listMyOrders(req.user.id));
  } catch {
    return res.status(500).json({ message: "Database error." });
  }
});

router.post("/checkout", requireAuth, async (req, res) => {
  try {
    return res.json(await orderService.checkout(req.user.id, req.body));
  } catch (err) {
    return res.status(err.status || 500).json({ message: err.message || "Database error." });
  }
});

module.exports = router;
