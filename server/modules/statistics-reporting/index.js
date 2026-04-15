const express = require("express");
const db = require("../../config/db");
const { requireAuth, requireAdmin } = require("../../middleware/auth");
const { observeModule, getAllModuleMetrics } = require("../shared/moduleObservability");

const MODULE_NAME = "statistics-reporting";
const router = express.Router();

router.use(observeModule(MODULE_NAME));

router.get("/overview", requireAuth, requireAdmin, (req, res) => {
  const sql = `
    SELECT
      (SELECT COUNT(*) FROM users) AS totalUsers,
      (SELECT COUNT(*) FROM users WHERE is_admin = 1) AS totalAdmins,
      (SELECT COUNT(*) FROM products) AS totalProducts,
      (SELECT COUNT(*) FROM orders) AS totalOrders,
      (SELECT COALESCE(SUM(total_price), 0) FROM orders) AS totalRevenue
  `;

  db.query(sql, (err, rows) => {
    if (err) {
      return res.status(500).json({ message: "Database error." });
    }

    const overview = rows && rows[0] ? rows[0] : {};
    return res.json({
      data: overview,
      generatedAt: new Date().toISOString(),
    });
  });
});

router.get("/reports/sales-by-day", requireAuth, requireAdmin, (req, res) => {
  const sql = `
    SELECT
      DATE(created_at) AS day,
      COUNT(*) AS ordersCount,
      COALESCE(SUM(total_price), 0) AS revenue
    FROM orders
    GROUP BY DATE(created_at)
    ORDER BY day DESC
    LIMIT 30
  `;

  db.query(sql, (err, rows) => {
    if (err) {
      return res.status(500).json({ message: "Database error." });
    }
    return res.json({
      items: rows || [],
      generatedAt: new Date().toISOString(),
    });
  });
});

router.get("/monitoring/modules", requireAuth, requireAdmin, (req, res) => {
  return res.json({
    modules: getAllModuleMetrics(),
    generatedAt: new Date().toISOString(),
  });
});

module.exports = {
  name: MODULE_NAME,
  basePath: "/api/v1/stats",
  router,
  publicApi: [
    "GET /api/v1/stats/overview",
    "GET /api/v1/stats/reports/sales-by-day",
    "GET /api/v1/stats/monitoring/modules",
  ],
  docsPath: "/docs/modules/statistics-reporting",
};
