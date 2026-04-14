const products = require("../persistence/productRepository");

async function listProducts() {
  return products.getAll();
}

async function getProduct(id) {
  return products.getById(id);
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

  return products.create({
    name,
    description,
    price,
    stock: Number.isFinite(stock) ? Math.max(0, stock) : 0,
  });
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
}

module.exports = { listProducts, getProduct, createProduct, updateProduct, deleteProduct };
