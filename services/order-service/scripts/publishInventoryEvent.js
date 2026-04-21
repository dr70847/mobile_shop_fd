const amqp = require("amqplib");

async function main() {
  const orderId = Number(process.argv[2] || 0);
  const result = String(process.argv[3] || "reserved").toLowerCase();
  if (!Number.isFinite(orderId) || orderId <= 0) {
    throw new Error("Usage: node scripts/publishInventoryEvent.js <orderId> <reserved|rejected>");
  }

  const routingKey = result === "rejected" ? "inventory.rejected" : "inventory.reserved";
  const payload = {
    orderId,
    reason: result === "rejected" ? "out_of_stock" : "inventory_confirmed",
    occurredAt: new Date().toISOString(),
  };

  const url = process.env.RABBITMQ_URL || "amqp://localhost:5672";
  const exchange = process.env.ORDERS_EXCHANGE || "orders";
  const connection = await amqp.connect(url);
  const channel = await connection.createChannel();
  await channel.assertExchange(exchange, "topic", { durable: true });
  channel.publish(exchange, routingKey, Buffer.from(JSON.stringify(payload)), { persistent: true });
  console.log(`Published ${routingKey} for orderId=${orderId}`);
  await channel.close();
  await connection.close();
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
