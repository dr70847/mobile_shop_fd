const { Op } = require("sequelize");
const { defineProductModel } = require("../db/models/Product");

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

function createSequelizeProductRepository() {
  const Product = defineProductModel();

  return {
    /**
     * Advanced listing with pagination + filtering.
     * Returns { data, meta }.
     */
    async findPage(query = {}) {
      const page = parsePositiveInt(query.page, 1);
      const limit = Math.min(parsePositiveInt(query.limit, 20), 100);
      const offset = (page - 1) * limit;

      const sort = parseSort(query.sort, ["createdAt", "price", "stock", "name", "id"], "createdAt");
      const dir = parseSortDir(query.dir);

      const where = {};

      const q = String(query.q || "").trim();
      if (q) {
        where[Op.or] = [
          { name: { [Op.like]: `%${q}%` } },
          { description: { [Op.like]: `%${q}%` } },
        ];
      }

      const minPrice = Number(query.minPrice);
      const maxPrice = Number(query.maxPrice);
      if (Number.isFinite(minPrice) || Number.isFinite(maxPrice)) {
        where.price = {};
        if (Number.isFinite(minPrice)) where.price[Op.gte] = minPrice;
        if (Number.isFinite(maxPrice)) where.price[Op.lte] = maxPrice;
      }

      const inStock = String(query.inStock || "").toLowerCase();
      if (inStock === "true") where.stock = { [Op.gt]: 0 };
      if (inStock === "false") where.stock = { [Op.eq]: 0 };

      const { count, rows } = await Product.findAndCountAll({
        where,
        limit,
        offset,
        order: [[sort, dir]],
        attributes: ["id", ["NAME", "name"], "description", "price", "stock", ["created_at", "created_at"]],
      });

      return {
        data: rows.map((r) => r.get({ plain: true })),
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

    // Compatibility methods (used elsewhere)
    async getAll() {
      const { data } = await this.findPage({ page: 1, limit: 100, sort: "createdAt", dir: "desc" });
      return data;
    },

    async getById(id) {
      return Product.findByPk(Number(id), {
        attributes: ["id", ["NAME", "name"], "description", "price", "stock", ["created_at", "created_at"]],
        raw: true,
      });
    },

    async getManyByIds(ids) {
      return Product.findAll({
        where: { id: { [Op.in]: ids.map(Number) } },
        attributes: ["id", "price", "stock"],
        raw: true,
      });
    },

    async create({ name, description, price, stock }) {
      const created = await Product.create({ name, description, price, stock });
      return { id: created.id };
    },

    async update(id, { name, description, price, stock }) {
      const [affected] = await Product.update(
        { name, description, price, stock },
        { where: { id: Number(id) } }
      );
      return affected > 0;
    },

    async remove(id) {
      const affected = await Product.destroy({ where: { id: Number(id) } });
      return affected > 0;
    },
  };
}

module.exports = { createSequelizeProductRepository };

