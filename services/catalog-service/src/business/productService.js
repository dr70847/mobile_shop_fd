const products = require("../persistence/productRepository");
const productCache = require("../integration/productCache");

async function listProducts() {
  const key = productCache.keys.list();
  const hit = await productCache.getJson(key);
  if (hit) return hit;
  const rows = await products.getAll();
  await productCache.setJson(key, rows);
  return rows;
}

async function getProduct(id) {
  const numericId = Number(id);
  const key = productCache.keys.product(numericId);
  const hit = await productCache.getJson(key);
  if (hit) return hit;
  const row = await products.getById(numericId);
  if (row) await productCache.setJson(key, row);
  return row;
}

async function createProduct(input) {
  const name = String(input?.name || "").trim();
  const description = String(input?.description || "").trim();
  const price = Number(input?.price);
  const stock = Number.parseInt(String(input?.stock ?? "0"), 10);

  if (!name || !Number.isFinite(price) || price < 0) {
    const err = new Error("Invalid product payload.");
    err.status = 400;
    throw err;
  }

  const created = await products.create({
    name,
    description,
    price,
    stock: Number.isFinite(stock) ? Math.max(0, stock) : 0,
  });
  await productCache.invalidateProduct(created?.id);
  return created;
}

async function updateProduct(id, input) {
  const numericId = Number(id);
  const name = String(input?.name || "").trim();
  const description = String(input?.description || "").trim();
  const price = Number(input?.price);
  const stock = Number.parseInt(String(input?.stock ?? "0"), 10);

  if (!Number.isFinite(numericId) || numericId <= 0 || !name || !Number.isFinite(price) || price < 0) {
    const err = new Error("Invalid product payload.");
    err.status = 400;
    throw err;
  }

  const updated = await products.update(numericId, {
    name,
    description,
    price,
    stock: Number.isFinite(stock) ? Math.max(0, stock) : 0,
  });

  if (!updated) {
    const err = new Error("Product not found.");
    err.status = 404;
    throw err;
  }
  await productCache.invalidateProduct(numericId);
  return { id: numericId };
}

async function deleteProduct(id) {
  const numericId = Number(id);
  if (!Number.isFinite(numericId) || numericId <= 0) {
    const err = new Error("Invalid product id.");
    err.status = 400;
    throw err;
  }
  const removed = await products.remove(numericId);
  if (!removed) {
    const err = new Error("Product not found.");
    err.status = 404;
    throw err;
  }
  await productCache.invalidateProduct(numericId);
}

module.exports = { listProducts, getProduct, createProduct, updateProduct, deleteProduct };
