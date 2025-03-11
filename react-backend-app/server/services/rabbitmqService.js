const amqp = require("amqplib");

class RabbitMQService {
  constructor() {
    this.connection = null;
    this.channel = null;
    this.tempReservations = new Map(); // In-memory storage
  }

  async connect() {
    try {
      this.connection = await amqp.connect("amqp://localhost");
      this.channel = await this.connection.createChannel();

      // Setup queue for expiring reservations
      await this.channel.assertQueue("reservation_expiry", { durable: false });

      // Handle reservation expiry
      this.channel.consume("reservation_expiry", async (msg) => {
        if (msg) {
          const { jamRoomId, date, slots } = JSON.parse(msg.content.toString());
          this.releaseReservation(jamRoomId, date, slots);
          this.channel.ack(msg);
        }
      });

      console.log("RabbitMQ Connected");
    } catch (error) {
      console.error("RabbitMQ Connection Error:", error);
    }
  }

  async createReservation(jamRoomId, date, slots, addons, userId) {
    const key = `${jamRoomId}-${date}`;
    const reservation = {
      userId,
      slots,
      addons, // Add addons to the reservation
      expiresAt: Date.now() + 10 * 60 * 1000, // 10 minutes
    };

    // Store in memory
    if (!this.tempReservations.has(key)) {
      this.tempReservations.set(key, new Map());
    }
    const roomReservations = this.tempReservations.get(key);

    // Check for slot and addon conflicts
    for (const slot of slots) {
      if (this.isSlotReserved(jamRoomId, date, slot.slotId)) {
        return { success: false, message: 'Some slots are already reserved' };
      }
      roomReservations.set(`slot-${slot.slotId}`, reservation);
    }

    // Check addon availability
    for (const addon of addons) {
      const reservedCount = this.getReservedAddonCount(
        jamRoomId,
        date,
        addon.addonId
      );
      if (reservedCount >= addon.quantity) {
        return {
          success: false,
          message: "Selected addon is no longer available",
        };
      }
      roomReservations.set(`addon-${addon.addonId}`, reservation);
    }

    // Schedule expiration
    const expiryMsg = { jamRoomId, date, slots, addons };
    setTimeout(() => {
      this.channel.sendToQueue(
        "reservation_expiry",
        Buffer.from(JSON.stringify(expiryMsg))
      );
    }, 5 * 60 * 1000); // 10 minutes

    return { success: true, expiresAt: reservation.expiresAt };
  }

  getReservedAddonCount(jamRoomId, date, addonId) {
    const key = `${jamRoomId}-${date}`;
    const roomReservations = this.tempReservations.get(key);
    if (!roomReservations) return 0;

    let count = 0;
    for (const [key, reservation] of roomReservations.entries()) {
      if (key.startsWith('addon-') && 
          key.includes(addonId) && 
          reservation.expiresAt > Date.now()) {
        count++;
      }
    }
    return count;
  }

  isSlotReserved(jamRoomId, date, slotId) {
    const key = `${jamRoomId}-${date}`;
    const roomReservations = this.tempReservations.get(key);
    if (!roomReservations) return false;
  
    const slotKey = `slot-${slotId}`; // Fix: Use the correct key format
    const reservation = roomReservations.get(slotKey);
    if (!reservation) return false;
  
    return reservation.expiresAt > Date.now();
  }

  releaseReservation(jamRoomId, date, slots) {
    const key = `${jamRoomId}-${date}`;
    const roomReservations = this.tempReservations.get(key);
    if (roomReservations) {
      if (roomReservations) {
        slots.forEach((slot) => {
          // Use the same key format as in createReservation
          roomReservations.delete(`slot-${slot.slotId}`);
        });
      }
    }
  }

  async cleanup() {
    if (this.channel) await this.channel.close();
    if (this.connection) await this.connection.close();
  }
}

module.exports = new RabbitMQService();
