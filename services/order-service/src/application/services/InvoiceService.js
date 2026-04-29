const { createNewOrder } = require("../../domain/order/Order");
const { OrderStatus } = require("../../domain/order/OrderStatus");

function badRequest(message) {
  const err = new Error(message);
  err.status = 400;
  return err;
}

function conflict(message) {
  const err = new Error(message);
  err.status = 409;
  return err;
}

/**
 * InvoiceService = checkout + order status lifecycle (simple).
 *
 * @param {{
 *  orderRepo: {
 *    getAll:()=>Promise<any[]>,
 *    getByUserId:(userId:number)=>Promise<any[]>,
 *    createOrder:(x:{userId:number,totalPrice:number,status:string})=>Promise<{id:number}>,
 *    addOrderItems:(items:any[])=>Promise<void>,
 *    updateStatus:(orderId:number,status:string)=>Promise<boolean>
 *  },
 *  productQuery: { getProductsByIds:(ids:number[])=>Promise<any[]> },
 *  availability: { checkAvailability:(ids:number[])=>Promise<any[]> },
 *  events: { publishOrderCreated:(payload:any)=>Promise<void>|void }
 * }} deps
 */
function createInvoiceService({ orderRepo, productQuery, availability, events }) {
  async function listOrders() {
    return orderRepo.getAll();
  }

  async function listMyOrders(userId) {
    return orderRepo.getByUserId(Number(userId));
  }

  async function checkout(userId, body) {
    const items = Array.isArray(body?.items) ? body.items : [];
    if (!items.length) throw badRequest("Cart is empty.");

    const cleaned = items
      .map((it) => ({ product_id: Number(it.product_id), quantity: Number(it.quantity) }))
      .filter(
        (it) =>
          Number.isFinite(it.product_id) &&
          it.product_id > 0 &&
          Number.isFinite(it.quantity) &&
          it.quantity > 0
      );
    if (!cleaned.length) throw badRequest("Invalid cart items.");

    const ids = [...new Set(cleaned.map((it) => it.product_id))];
    let rows = [];
    try {
      rows = await availability.checkAvailability(ids);
    } catch {
      rows = await productQuery.getProductsByIds(ids);
    }

    const priceById = new Map(rows.map((p) => [Number(p.id), Number(p.price || 0)]));
    const stockById = new Map(rows.map((p) => [Number(p.id), Number(p.stock || Number.MAX_SAFE_INTEGER)]));

    let total = 0;
    const lineItems = [];
    for (const it of cleaned) {
      if (!priceById.has(it.product_id)) throw badRequest(`Unknown product_id: ${it.product_id}`);
      if (stockById.has(it.product_id) && it.quantity > stockById.get(it.product_id)) {
        throw conflict(`Insufficient stock for product_id: ${it.product_id}`);
      }
      const unitPrice = priceById.get(it.product_id);
      total += unitPrice * it.quantity;
      lineItems.push([it.product_id, it.quantity, unitPrice]);
    }

    const order = createNewOrder({ userId, totalPrice: Number(total.toFixed(2)) });
    const created = await orderRepo.createOrder({
      userId: order.userId,
      totalPrice: order.totalPrice,
      status: order.status,
    });

    const orderItems = lineItems.map((v) => [created.id, v[0], v[1], v[2]]);
    await orderRepo.addOrderItems(orderItems);

    await events.publishOrderCreated?.({
      orderId: created.id,
      userId: order.userId,
      total: order.totalPrice,
      items: cleaned,
      createdAt: new Date().toISOString(),
    });

    return { orderId: created.id };
  }

  async function handleInventoryEvent(eventType, payload) {
    const orderId = Number(payload?.orderId);
    if (!Number.isFinite(orderId) || orderId <= 0) return false;

    let nextStatus = null;
    if (eventType === "inventory.reserved") nextStatus = OrderStatus.CONFIRMED;
    if (eventType === "inventory.rejected") nextStatus = OrderStatus.CANCELLED;
    if (!nextStatus) return false;

    return orderRepo.updateStatus(orderId, nextStatus);
  }

  return { listOrders, listMyOrders, checkout, handleInventoryEvent };
}

module.exports = { createInvoiceService };

