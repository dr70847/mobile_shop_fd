const amqp = require("amqplib");
const orderService = require("../business/orderService");

let started = false;

async function startInventoryEventConsumer() {
  if (started) return;
  started = true;

  const url = process.env.RABBITMQ_URL || "amqp://localhost:5672";
  const exchange = process.env.ORDERS_EXCHANGE || "orders";
  const queue = process.env.INVENTORY_EVENTS_QUEUE || "order-service.inventory.events";

  try {
    const connection = await amqp.connect(url);
    const channel = await connection.createChannel();
    await channel.assertExchange(exchange, "topic", { durable: true });
    await channel.assertQueue(queue, { durable: true });
    await channel.bindQueue(queue, exchange, "inventory.reserved");
    await channel.bindQueue(queue, exchange, "inventory.rejected");

    channel.consume(queue, async (msg) => {
      if (!msg) return;
      try {
        const payload = JSON.parse(msg.content.toString("utf8"));
        const handled = await orderService.handleInventoryEvent(msg.fields.routingKey, payload);
        if (!handled) {
          console.warn("Inventory event ignored:", msg.fields.routingKey, payload);
        }
        channel.ack(msg);
      } catch (err) {
        console.error("Failed to process inventory event:", err.message);
        channel.nack(msg, false, false);
      }
    });

    console.log("Inventory event consumer started.");
  } catch (err) {
    started = false;
    console.error("Inventory event consumer failed to start:", err.message);
  }
}

module.exports = { startInventoryEventConsumer };
