const { Op } = require("sequelize");
const { defineOrderModel } = require("../db/models/Order");
const { defineOrderItemModel } = require("../db/models/OrderItem");

function parsePositiveInt(value, fallback) {
  const n = Number.parseInt(String(value ?? ""), 10);
  if (!Number.isFinite(n) || n <= 0) return fallback;
  return n;
}

function parseSort(value, allowed, fallback) {
  const v = String(value || "").trim();
  if (allowed.includes(v)) return v;
  return fallback;
}

function parseSortDir(value) {
  return String(value || "").toLowerCase() === "asc" ? "ASC" : "DESC";
}

function parseDate(value) {
  const s = String(value || "").trim();
  if (!s) return null;
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? null : d;
}

function createSequelizeOrderRepository() {
  const Order = defineOrderModel();
  const OrderItem = defineOrderItemModel();

  return {
    /**
     * findPage({ page, limit, sort, dir, status, userId, minTotal, maxTotal, dateFrom, dateTo })
     */
    async findPage(query = {}) {
      const page = parsePositiveInt(query.page, 1);
      const limit = Math.min(parsePositiveInt(query.limit, 20), 100);
      const offset = (page - 1) * limit;

      const sort = parseSort(query.sort, ["createdAt", "totalPrice", "status", "id"], "createdAt");
      const dir = parseSortDir(query.dir);

      const where = {};

      const status = String(query.status || "").trim();
      if (status) where.status = status;

      const userId = query.userId != null ? Number(query.userId) : null;
      if (Number.isFinite(userId) && userId > 0) where.userId = userId;

      const minTotal = Number(query.minTotal);
      const maxTotal = Number(query.maxTotal);
      if (Number.isFinite(minTotal) || Number.isFinite(maxTotal)) {
        where.totalPrice = {};
        if (Number.isFinite(minTotal)) where.totalPrice[Op.gte] = minTotal;
        if (Number.isFinite(maxTotal)) where.totalPrice[Op.lte] = maxTotal;
      }

      const dateFrom = parseDate(query.dateFrom);
      const dateTo = parseDate(query.dateTo);
      if (dateFrom || dateTo) {
        where.createdAt = {};
        if (dateFrom) where.createdAt[Op.gte] = dateFrom;
        if (dateTo) where.createdAt[Op.lte] = dateTo;
      }

      const { count, rows } = await Order.findAndCountAll({
        where,
        limit,
        offset,
        order: [[sort, dir]],
        raw: true,
      });

      return {
        data: rows,
        meta: {
          page,
          limit,
          total: count,
          totalPages: Math.max(1, Math.ceil(count / limit)),
          sort,
          dir: dir.toLowerCase(),
        },
      };
    },

    async getAll() {
      const { data } = await this.findPage({ page: 1, limit: 100, sort: "createdAt", dir: "desc" });
      return data;
    },

    async getByUserId(userId) {
      const { data } = await this.findPage({ page: 1, limit: 100, sort: "createdAt", dir: "desc", userId });
      return data;
    },

    async createOrder({ userId, totalPrice, status }) {
      const created = await Order.create({ userId, totalPrice, status });
      return { id: created.id };
    },

    async addOrderItems(items) {
      // items: [[orderId, productId, quantity, unitPrice], ...]
      const rows = items.map((it) => ({
        orderId: Number(it[0]),
        productId: Number(it[1]),
        quantity: Number(it[2]),
        unitPrice: Number(it[3]),
      }));
      if (!rows.length) return;
      await OrderItem.bulkCreate(rows);
    },

    async updateStatus(orderId, status) {
      const [affected] = await Order.update({ status }, { where: { id: Number(orderId) } });
      return affected > 0;
    },
  };
}

module.exports = { createSequelizeOrderRepository };

