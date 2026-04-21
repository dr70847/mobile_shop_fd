const express = require("express");
const Category = require("../models/Category");
const { requireAuth, requireAdmin } = require("../middleware/auth");

const router = express.Router();
const adminChain = [requireAuth, requireAdmin];
const apiVersionPath = "/api/v1/categories";

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

router.get("/", (req, res) => {
  Category.getAll((err, rows) => {
    if (err) return res.status(500).json({ message: "Database error." });
    return res.json({ items: rows.map((r) => withLinks(req, r)) });
  });
});

router.get("/:id", (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isFinite(id) || id <= 0) return res.status(400).json({ message: "Invalid category id." });
  Category.getById(id, (err, rows) => {
    if (err) return res.status(500).json({ message: "Database error." });
    if (!rows || !rows[0]) return res.status(404).json({ message: "Category not found." });
    return res.json(withLinks(req, rows[0]));
  });
});

router.post("/", ...adminChain, (req, res) => {
  const name = String(req.body?.name || "").trim();
  const slug = String(req.body?.slug || "").trim().toLowerCase();
  if (!name || !slug) return res.status(400).json({ message: "Name and slug are required." });
  Category.create({ name, slug }, (err, result) => {
    if (err) {
      if (err.code === "ER_DUP_ENTRY") return res.status(409).json({ message: "Category slug already exists." });
      return res.status(500).json({ message: "Database error." });
    }
    Category.getById(result.insertId, (err2, rows) => {
      if (err2 || !rows?.[0]) return res.status(201).json({ id: result.insertId });
      return res.status(201).json(withLinks(req, rows[0]));
    });
  });
});

router.put("/:id", ...adminChain, (req, res) => {
  const id = Number(req.params.id);
  const name = String(req.body?.name || "").trim();
  const slug = String(req.body?.slug || "").trim().toLowerCase();
  if (!Number.isFinite(id) || id <= 0) return res.status(400).json({ message: "Invalid category id." });
  if (!name || !slug) return res.status(400).json({ message: "Name and slug are required." });
  Category.update(id, { name, slug }, (err, result) => {
    if (err) {
      if (err.code === "ER_DUP_ENTRY") return res.status(409).json({ message: "Category slug already exists." });
      return res.status(500).json({ message: "Database error." });
    }
    if (!result.affectedRows) return res.status(404).json({ message: "Category not found." });
    Category.getById(id, (err2, rows) => {
      if (err2 || !rows?.[0]) return res.json({ id });
      return res.json(withLinks(req, rows[0]));
    });
  });
});

router.delete("/:id", ...adminChain, (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isFinite(id) || id <= 0) return res.status(400).json({ message: "Invalid category id." });
  Category.delete(id, (err, result) => {
    if (err) return res.status(500).json({ message: "Database error." });
    if (!result.affectedRows) return res.status(404).json({ message: "Category not found." });
    return res.status(204).send();
  });
});

module.exports = router;
