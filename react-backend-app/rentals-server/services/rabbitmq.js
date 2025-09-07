import amqplib from 'amqplib';

let connection;
let channel;

const DEFAULT_QUEUE = process.env.RABBIT_QUEUE || 'borzo_jobs';
const MAX_RETRIES = parseInt(process.env.RABBIT_MAX_RETRIES || '3', 10);
const PREFETCH = parseInt(process.env.RABBIT_PREFETCH || '5', 10);

export async function connectRabbit() {
  if (channel) return channel;
  connection = await amqplib.connect(process.env.RABBIT_URL || 'amqp://localhost');
  channel = await connection.createChannel();
  await channel.assertQueue(DEFAULT_QUEUE, { durable: true });
  channel.prefetch(PREFETCH);
  console.log('[rabbitmq] connected');
  return channel;
}

export async function publishJob(queue = DEFAULT_QUEUE, msgObj, opts = {}) {
  const ch = await connectRabbit();
  const payload = Buffer.from(JSON.stringify(msgObj));
  ch.sendToQueue(queue, payload, {
    persistent: true,
    contentType: 'application/json',
    ...opts
  });
}

export async function consumeJobs(queue = DEFAULT_QUEUE, onMessage) {
  const ch = await connectRabbit();
  await ch.consume(queue, async (msg) => {
    if (!msg) return;
    try {
      const data = JSON.parse(msg.content.toString());
      await onMessage(data);
      ch.ack(msg);
    } catch (err) {
      const prevRetries = (msg.properties.headers?.['x-retries']) || 0;
      const attempt = prevRetries + 1;
      console.error(`[rabbitmq] job failed (attempt ${attempt})`, err.message);
      if (attempt <= MAX_RETRIES) {
        ch.nack(msg, false, true); // requeue
      } else {
        console.error('[rabbitmq] dropping message after max retries');
        ch.nack(msg, false, false); // discard (or DLQ if configured)
      }
    }
  });
}

