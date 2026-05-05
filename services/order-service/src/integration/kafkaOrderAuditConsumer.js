const { Kafka } = require("kafkajs");

/**
 * Konsumator opsional i Kafka për të demonstruar mesazhimin asinkron (audit / log).
 * Aktivizo me ENABLE_KAFKA_AUDIT_CONSUMER=true dhe KAFKA_BROKERS.
 */
function startKafkaOrderAuditConsumer() {
  if (String(process.env.ENABLE_KAFKA_AUDIT_CONSUMER || "").toLowerCase() !== "true") {
    return;
  }

  const brokers = String(process.env.KAFKA_BROKERS || "localhost:9092")
    .split(",")
    .map((b) => b.trim())
    .filter(Boolean);
  const topic = process.env.KAFKA_TOPIC || "order-created";

  const kafka = new Kafka({ clientId: "order-service-audit-consumer", brokers });
  const consumer = kafka.consumer({ groupId: "order-service-audit-log" });

  consumer
    .connect()
    .then(() => consumer.subscribe({ topic, fromBeginning: false }))
    .then(() =>
      consumer.run({
        eachMessage: async ({ topic: t, message }) => {
          console.log(`[Kafka consumer] ${t} offset=${message.offset} value=${message.value?.toString()}`);
        },
      }),
    )
    .catch((err) => {
      console.warn("[Kafka consumer] failed to start:", err.message);
    });
}

module.exports = { startKafkaOrderAuditConsumer };
