import amqplib from "amqplib";

const RABBITMQ_URL = process.env.RABBITMQ_URL || "amqp://localhost:5672";
let channel: any = null;
let connection: any = null;

async function ensureChannel(): Promise<any> {
  if (channel) return channel;
  connection = await amqplib.connect(RABBITMQ_URL);
  channel = await connection.createChannel();

  const QUEUE_TTL = process.env.QUEUE_TTL ? Number(process.env.QUEUE_TTL) : undefined;
  const assertOpts: any = { durable: true };
  if (QUEUE_TTL !== undefined) assertOpts.arguments = { "x-message-ttl": QUEUE_TTL };

  // Check if queue exists to avoid PRECONDITION errors when arguments differ
  try {
    await channel.checkQueue("device_commands");
  } catch (err: any) {
    const msg = String(err && err.message ? err.message : err);
    if (msg.includes("NOT_FOUND") || msg.includes("not found") || msg.includes("404")) {
      await channel.assertQueue("device_commands", assertOpts);
    } else {
      console.warn("Unexpected error checking queue device_commands:", err);
      await channel.assertQueue("device_commands", assertOpts);
    }
  }

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
