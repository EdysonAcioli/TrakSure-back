import amqplib from "amqplib";

const RABBITMQ_URL = process.env.RABBITMQ_URL || "amqp://localhost:5672";
let channel: amqplib.Channel | null = null;
let connection: amqplib.Connection | null = null;

async function ensureChannel(): Promise<amqplib.Channel> {
  if (channel) return channel;
  connection = await amqplib.connect(RABBITMQ_URL);
  channel = await connection.createChannel();
  await channel.assertQueue("device_commands", { durable: true });
  return channel;
}

export async function publishCommand(message: Record<string, unknown>) {
  const ch = await ensureChannel();
  const buffer = Buffer.from(JSON.stringify(message));
  return ch.sendToQueue("device_commands", buffer, { persistent: true });
}

export async function closeQueue() {
  try {
    if (channel) await channel.close();
    if (connection) await connection.close();
  } catch (err) {
    console.error("erro ao fechar fila:", err);
  } finally {
    channel = null;
    connection = null;
  }
}