/**
 * AnalyticsService = read-only business reporting.
 *
 * Kept intentionally simple (DDD-lite): works on repository output
 * without pulling extra dependencies.
 *
 * @param {{ orderRepo: { getAll:()=>Promise<any[]> } }} deps
 */
function createAnalyticsService({ orderRepo }) {
  async function salesSummary() {
    const rows = await orderRepo.getAll();
    const totalOrders = rows.length;
    const totalRevenue = rows.reduce((sum, r) => sum + Number(r.total_price || r.totalPrice || 0), 0);
    const byStatus = rows.reduce((acc, r) => {
      const s = String(r.STATUS || r.status || "UNKNOWN");
      acc[s] = (acc[s] || 0) + 1;
      return acc;
    }, {});

    return {
      totalOrders,
      totalRevenue: Number(totalRevenue.toFixed(2)),
      byStatus,
    };
  }

  return { salesSummary };
}

module.exports = { createAnalyticsService };

