const express = require("express");
const productService = require("../business/productService");
const { requireAuth, requireAdmin } = require("./authMiddleware");

const router = express.Router();

router.get("/", async (_req, res) => {
  try {
    return res.json(await productService.listProducts());
  } catch {
    return res.status(500).json({ message: "Database error." });
  }
});

router.get("/:id", async (req, res) => {
  try {
    return res.json(await productService.getProduct(req.params.id));
  } catch {
    return res.status(500).json({ message: "Database error." });
  }
});

router.post("/", requireAuth, requireAdmin, async (req, res) => {
  try {
    const created = await productService.createProduct(req.body);
    return res.status(201).json(created);
  } catch (err) {
    return res.status(err.status || 500).json({ message: err.message || "Database error." });
  }
});

router.put("/:id", requireAuth, requireAdmin, async (req, res) => {
  try {
    return res.json(await productService.updateProduct(req.params.id, req.body));
  } catch (err) {
    return res.status(err.status || 500).json({ message: err.message || "Database error." });
  }
});

router.delete("/:id", requireAuth, requireAdmin, async (req, res) => {
  try {
    await productService.deleteProduct(req.params.id);
    return res.status(204).send();
  } catch (err) {
    return res.status(err.status || 500).json({ message: err.message || "Database error." });
  }
});

module.exports = router;
