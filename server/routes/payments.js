const express = require("express");
const Payment = require("../models/Payment");
const { requireAuth, requireAdmin } = require("../middleware/auth");

const router = express.Router();
const adminChain = [requireAuth, requireAdmin];
const apiVersionPath = "/api/v1/payments";
const allowedTypes = new Set(["CARD", "WALLET"]);
const allowedStatuses = new Set(["PENDING", "AUTHORIZED", "CAPTURED", "FAILED"]);

function rootUrl(req) {
  return `${req.protocol}://${req.get("host")}`;
}

function withLinks(req, item) {
  return {
    ...item,
    _links: {
      self: { href: `${rootUrl(req)}${apiVersionPath}/${item.id}` },
      collection: { href: `${rootUrl(req)}${apiVersionPath}` },
    },
  };
}

router.get("/", ...adminChain, (req, res) => {
  Payment.getAll((err, rows) => {
    if (err) return res.status(500).json({ message: "Database error." });
    return res.json({ items: rows.map((r) => withLinks(req, r)) });
  });
});

router.get("/:id", ...adminChain, (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isFinite(id) || id <= 0) return res.status(400).json({ message: "Invalid payment id." });
  Payment.getById(id, (err, rows) => {
    if (err) return res.status(500).json({ message: "Database error." });
    if (!rows?.[0]) return res.status(404).json({ message: "Payment not found." });
    return res.json(withLinks(req, rows[0]));
  });
});

router.post("/", ...adminChain, (req, res) => {
  const orderId = Number(req.body?.order_id);
  const amount = Number(req.body?.amount);
  const paymentType = String(req.body?.payment_type || "").toUpperCase();
  const status = String(req.body?.status || "PENDING").toUpperCase();
  const providerRef = String(req.body?.provider_ref || "").trim() || null;

  if (!Number.isFinite(orderId) || orderId <= 0) return res.status(400).json({ message: "Invalid order id." });
  if (!Number.isFinite(amount) || amount <= 0) return res.status(400).json({ message: "Invalid payment amount." });
  if (!allowedTypes.has(paymentType)) return res.status(400).json({ message: "Invalid payment_type." });
  if (!allowedStatuses.has(status)) return res.status(400).json({ message: "Invalid payment status." });

  Payment.create({ orderId, paymentType, amount, status, providerRef }, (err, result) => {
    if (err) return res.status(500).json({ message: "Database error." });
    Payment.getById(result.insertId, (err2, rows) => {
      if (err2 || !rows?.[0]) return res.status(201).json({ id: result.insertId });
      return res.status(201).json(withLinks(req, rows[0]));
    });
  });
});

router.patch("/:id/status", ...adminChain, (req, res) => {
  const id = Number(req.params.id);
  const status = String(req.body?.status || "").toUpperCase();
  if (!Number.isFinite(id) || id <= 0) return res.status(400).json({ message: "Invalid payment id." });
  if (!allowedStatuses.has(status)) return res.status(400).json({ message: "Invalid payment status." });
  Payment.updateStatus(id, status, (err, result) => {
    if (err) return res.status(500).json({ message: "Database error." });
    if (!result.affectedRows) return res.status(404).json({ message: "Payment not found." });
    Payment.getById(id, (err2, rows) => {
      if (err2 || !rows?.[0]) return res.json({ id, status });
      return res.json(withLinks(req, rows[0]));
    });
  });
});

module.exports = router;
