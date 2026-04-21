const express = require("express");
const Review = require("../models/Review");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();
const apiVersionPath = "/api/v1/reviews";

function rootUrl(req) {
  return `${req.protocol}://${req.get("host")}`;
}

function withLinks(req, item) {
  return {
    ...item,
    _links: {
      self: { href: `${rootUrl(req)}${apiVersionPath}/${item.id}` },
      productReviews: { href: `${rootUrl(req)}${apiVersionPath}/product/${item.product_id}` },
    },
  };
}

router.get("/product/:productId", (req, res) => {
  const productId = Number(req.params.productId);
  if (!Number.isFinite(productId) || productId <= 0) return res.status(400).json({ message: "Invalid product id." });
  Review.getAllByProductId(productId, (err, rows) => {
    if (err) return res.status(500).json({ message: "Database error." });
    return res.json({ items: rows.map((r) => withLinks(req, r)) });
  });
});

router.post("/", requireAuth, (req, res) => {
  const productId = Number(req.body?.product_id);
  const rating = Number(req.body?.rating);
  const comment = String(req.body?.comment || "").trim();
  if (!Number.isFinite(productId) || productId <= 0) return res.status(400).json({ message: "Invalid product id." });
  if (!Number.isFinite(rating) || rating < 1 || rating > 5) return res.status(400).json({ message: "Rating must be 1-5." });
  Review.create({ userId: req.user.id, productId, rating, comment }, (err, result) => {
    if (err) {
      if (err.code === "ER_DUP_ENTRY") return res.status(409).json({ message: "You already reviewed this product." });
      return res.status(500).json({ message: "Database error." });
    }
    Review.getById(result.insertId, (err2, rows) => {
      if (err2 || !rows?.[0]) return res.status(201).json({ id: result.insertId });
      return res.status(201).json(withLinks(req, rows[0]));
    });
  });
});

router.put("/:id", requireAuth, (req, res) => {
  const id = Number(req.params.id);
  const rating = Number(req.body?.rating);
  const comment = String(req.body?.comment || "").trim();
  if (!Number.isFinite(id) || id <= 0) return res.status(400).json({ message: "Invalid review id." });
  if (!Number.isFinite(rating) || rating < 1 || rating > 5) return res.status(400).json({ message: "Rating must be 1-5." });

  Review.getById(id, (err, rows) => {
    if (err) return res.status(500).json({ message: "Database error." });
    const review = rows?.[0];
    if (!review) return res.status(404).json({ message: "Review not found." });
    const isOwner = Number(review.user_id) === Number(req.user.id);
    const isAdmin = Boolean(req.user?.is_admin);
    if (!isOwner && !isAdmin) return res.status(403).json({ message: "Not allowed." });

    Review.update(id, { rating, comment }, (err2, result) => {
      if (err2) return res.status(500).json({ message: "Database error." });
      if (!result.affectedRows) return res.status(404).json({ message: "Review not found." });
      Review.getById(id, (err3, rows2) => {
        if (err3 || !rows2?.[0]) return res.json({ id });
        return res.json(withLinks(req, rows2[0]));
      });
    });
  });
});

router.delete("/:id", requireAuth, (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isFinite(id) || id <= 0) return res.status(400).json({ message: "Invalid review id." });
  Review.getById(id, (err, rows) => {
    if (err) return res.status(500).json({ message: "Database error." });
    const review = rows?.[0];
    if (!review) return res.status(404).json({ message: "Review not found." });
    const isOwner = Number(review.user_id) === Number(req.user.id);
    const isAdmin = Boolean(req.user?.is_admin);
    if (!isOwner && !isAdmin) return res.status(403).json({ message: "Not allowed." });
    Review.delete(id, (err2) => {
      if (err2) return res.status(500).json({ message: "Database error." });
      return res.status(204).send();
    });
  });
});

module.exports = router;
