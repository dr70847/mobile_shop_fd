const orders = require("../persistence/orderRepository");
const catalog = require("../persistence/catalogReadRepository");
const { checkAvailability } = require("../integration/grpcCatalogClient");
const { publishOrderCreated } = require("../integration/messageBus");

async function listOrders() {
  return orders.getAll();
}

async function listMyOrders(userId) {
  return orders.getByUserId(userId);
}

async function checkout(userId, body) {
  const items = Array.isArray(body?.items) ? body.items : [];
  if (!items.length) {
    const err = new Error("Cart is empty.");
    err.status = 400;
    throw err;
  }

  const cleaned = items
    .map((it) => ({ product_id: Number(it.product_id), quantity: Number(it.quantity) }))
    .filter((it) => Number.isFinite(it.product_id) && it.product_id > 0 && Number.isFinite(it.quantity) && it.quantity > 0);
  if (!cleaned.length) {
    const err = new Error("Invalid cart items.");
    err.status = 400;
    throw err;
  }

  const ids = [...new Set(cleaned.map((it) => it.product_id))];
  let rows = [];
  try {
    rows = await checkAvailability(ids);
  } catch {
    rows = await catalog.getProductsByIds(ids);
  }
  const priceById = new Map(rows.map((p) => [p.id, Number(p.price || 0)]));
  const stockById = new Map(rows.map((p) => [p.id, Number(p.stock || Number.MAX_SAFE_INTEGER)]));

  let total = 0;
  const lineItems = [];
  for (const it of cleaned) {
    if (!priceById.has(it.product_id)) {
      const err = new Error(`Unknown product_id: ${it.product_id}`);
      err.status = 400;
      throw err;
    }
    if (stockById.has(it.product_id) && it.quantity > stockById.get(it.product_id)) {
      const err = new Error(`Insufficient stock for product_id: ${it.product_id}`);
      err.status = 409;
      throw err;
    }
    const unitPrice = priceById.get(it.product_id);
    total += unitPrice * it.quantity;
    lineItems.push([it.product_id, it.quantity, unitPrice]);
  }

  const created = await orders.createOrder({
    userId,
    totalPrice: Number(total.toFixed(2)),
    status: "NEW",
  });
  const orderItems = lineItems.map((v) => [created.id, v[0], v[1], v[2]]);
  await orders.addOrderItems(orderItems);
  await publishOrderCreated({
    orderId: created.id,
    userId,
    total: Number(total.toFixed(2)),
    items: cleaned,
    createdAt: new Date().toISOString(),
  });

  return { orderId: created.id };
}

module.exports = { listOrders, listMyOrders, checkout };
