const express = require("express");
const { createContainer } = require("../app/container");
const { requireAuth } = require("./authMiddleware");

const router = express.Router();
const { invoiceService } = createContainer();

router.get("/", async (_req, res) => {
  try {
    return res.json(await invoiceService.listOrders(_req.query));
  } catch {
    return res.status(500).json({ message: "Database error." });
  }
});

router.get("/my", requireAuth, async (req, res) => {
  try {
    return res.json(await invoiceService.listMyOrders(req.user.id, req.query));
  } catch {
    return res.status(500).json({ message: "Database error." });
  }
});

router.post("/checkout", requireAuth, async (req, res) => {
  try {
    return res.json(await invoiceService.checkout(req.user.id, req.body));
  } catch (err) {
    return res.status(err.status || 500).json({ message: err.message || "Database error." });
  }
});

router.post("/events/inventory", async (req, res) => {
  const expectedKey = process.env.INTERNAL_API_KEY;
  const receivedKey = req.headers["x-internal-api-key"];
  if (expectedKey && receivedKey !== expectedKey) {
    return res.status(401).json({ message: "Unauthorized internal event." });
  }

  try {
    const eventType = String(req.body?.eventType || "");
    const payload = req.body?.payload || {};
    const applied = await invoiceService.handleInventoryEvent(eventType, payload);
    return res.json({ applied });
  } catch (err) {
    return res.status(500).json({ message: err.message || "Event handling failed." });
  }
});

module.exports = router;
