import amqplib from 'amqplib';

let connection;
let channel;

const DEFAULT_QUEUE = process.env.RABBIT_QUEUE || 'borzo_jobs';
const MAX_RETRIES = parseInt(process.env.RABBIT_MAX_RETRIES || '3', 10);
const PREFETCH = parseInt(process.env.RABBIT_PREFETCH || '5', 10);

export async function connectRabbit() {
  if (channel) return channel;
  connection = await amqplib.connect(process.env.RABBITMQ_URL || 'amqp://localhost');
  channel = await connection.createChannel();
  await channel.assertQueue(DEFAULT_QUEUE, { durable: true });
  await channel.assertQueue('borzo_tracking', { durable: true });
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
    
    let data; // Declare data variable here
    try {
      data = JSON.parse(msg.content.toString());
      await onMessage(data);
      ch.ack(msg); // Success - acknowledge the message
    } catch (err) {
      const prevRetries = (msg.properties.headers?.['x-retries']) || 0;
      const attempt = prevRetries + 1;
      
      console.error(`[rabbitmq] job failed (attempt ${attempt}/${MAX_RETRIES})`, err.message);
      
      // Check if it's a 400 error (bad request) - don't retry these
      if (err.response && err.response.status === 400) {
        console.error('[rabbitmq] 400 error - discarding message (bad request):', err.response.data);
        ch.nack(msg, false, false); // Don't requeue 400 errors
        return;
      }
      
      // Only retry if we have data parsed successfully
      if (data && attempt < MAX_RETRIES) {
        // Republish with retry count
        const retryMsg = {
          ...data,
          __retryCount: attempt
        };
        
        await publishJob(queue, retryMsg, {
          headers: { 'x-retries': attempt }
        });
        
        ch.nack(msg, false, false); // Remove original message
      } else {
        console.error('[rabbitmq] dropping message after max retries or parsing failed');
        ch.nack(msg, false, false); // Discard after max retries
      }
    }
  });
}