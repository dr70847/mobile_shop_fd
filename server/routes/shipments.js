const express = require("express");
const Shipment = require("../models/Shipment");
const { requireAuth, requireAdmin } = require("../middleware/auth");

const router = express.Router();
const adminChain = [requireAuth, requireAdmin];
const apiVersionPath = "/api/v1/shipments";
const allowedStatuses = new Set(["PENDING", "IN_TRANSIT", "DELIVERED", "RETURNED"]);

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
  Shipment.getAll((err, rows) => {
    if (err) return res.status(500).json({ message: "Database error." });
    return res.json({ items: rows.map((r) => withLinks(req, r)) });
  });
});

router.get("/:id", ...adminChain, (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isFinite(id) || id <= 0) return res.status(400).json({ message: "Invalid shipment id." });
  Shipment.getById(id, (err, rows) => {
    if (err) return res.status(500).json({ message: "Database error." });
    if (!rows?.[0]) return res.status(404).json({ message: "Shipment not found." });
    return res.json(withLinks(req, rows[0]));
  });
});

router.post("/", ...adminChain, (req, res) => {
  const orderId = Number(req.body?.order_id);
  const trackingNumber = String(req.body?.tracking_number || "").trim() || null;
  const carrier = String(req.body?.carrier || "").trim() || null;
  const status = String(req.body?.status || "PENDING").toUpperCase();

  if (!Number.isFinite(orderId) || orderId <= 0) return res.status(400).json({ message: "Invalid order id." });
  if (!allowedStatuses.has(status)) return res.status(400).json({ message: "Invalid shipment status." });

  Shipment.create({ orderId, trackingNumber, carrier, status }, (err, result) => {
    if (err) {
      if (err.code === "ER_DUP_ENTRY") return res.status(409).json({ message: "Order already has a shipment." });
      return res.status(500).json({ message: "Database error." });
    }
    Shipment.getById(result.insertId, (err2, rows) => {
      if (err2 || !rows?.[0]) return res.status(201).json({ id: result.insertId });
      return res.status(201).json(withLinks(req, rows[0]));
    });
  });
});

router.patch("/:id/status", ...adminChain, (req, res) => {
  const id = Number(req.params.id);
  const status = String(req.body?.status || "").toUpperCase();
  if (!Number.isFinite(id) || id <= 0) return res.status(400).json({ message: "Invalid shipment id." });
  if (!allowedStatuses.has(status)) return res.status(400).json({ message: "Invalid shipment status." });
  Shipment.updateStatus(id, status, (err, result) => {
    if (err) return res.status(500).json({ message: "Database error." });
    if (!result.affectedRows) return res.status(404).json({ message: "Shipment not found." });
    Shipment.getById(id, (err2, rows) => {
      if (err2 || !rows?.[0]) return res.json({ id, status });
      return res.json(withLinks(req, rows[0]));
    });
  });
});

module.exports = router;
