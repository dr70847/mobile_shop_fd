const amqp = require("amqplib");
const { Kafka } = require("kafkajs");

let rabbitChannel;
let kafkaProducer;

async function getRabbitChannel() {
  if (rabbitChannel) return rabbitChannel;
  const url = process.env.RABBITMQ_URL || "amqp://localhost:5672";
  const connection = await amqp.connect(url);
  const channel = await connection.createChannel();
  await channel.assertExchange("orders", "topic", { durable: true });
  rabbitChannel = channel;
  return rabbitChannel;
}

async function getKafkaProducer() {
  if (kafkaProducer) return kafkaProducer;
  const brokers = String(process.env.KAFKA_BROKERS || "localhost:9092").split(",");
  const kafka = new Kafka({ clientId: "order-service", brokers });
  kafkaProducer = kafka.producer();
  await kafkaProducer.connect();
  return kafkaProducer;
}

async function publishOrderCreated(payload) {
  const serialized = JSON.stringify(payload);
  try {
    const channel = await getRabbitChannel();
    channel.publish("orders", "orders.created", Buffer.from(serialized), { persistent: true });
  } catch (err) {
    console.error("RabbitMQ publish failed:", err.message);
  }

  try {
    const producer = await getKafkaProducer();
    const topic = process.env.KAFKA_TOPIC || "order-created";
    await producer.send({ topic, messages: [{ value: serialized }] });
  } catch (err) {
    console.error("Kafka publish failed:", err.message);
  }
}

module.exports = { publishOrderCreated };
