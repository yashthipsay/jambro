const amqp = require("amqplib");

class RabbitMQService {
  constructor() {
    this.connection = null;
    this.channel = null;
    this.tempReservations = new Map(); // In-memory storage

    // Add exchange names
    this.mainExchange = "reservations.exchange";
    this.deadLetterExchange = "reservations.dlx";
  }

  async connect() {
    try {
      this.connection = await amqp.connect("amqp://localhost");
      this.channel = await this.connection.createChannel();

      // Assert Exchanges
      await this.channel.assertExchange(this.mainExchange, "direct", {
        durable: true,
      });
      await this.channel.assertExchange(this.deadLetterExchange, "direct", {
        durable: true,
      });

      // Setup queue for expiring reservations
      await this.channel.assertQueue("reservation_expiry", {
        durable: true,
        arguments: {
          "x-dead-letter-exchange": this.deadLetterExchange,
          "x-dead-routing-key": "expired.reservation",
          "x-message-ttl": 5 * 60 * 1000, // 5 minutes
          "x-max-length": 1000, //Max queue length
        },
      });

      // Assert dead letter queue
      await this.channel.assertQueue("reservation_dlq", {
        durable: true,
      });

      // Bind queue to exchanges
      await this.channel.bindQueue(
        "reservation_expiry",
        this.mainExchange,
        "new.reservation"
      );
      await this.channel.bindQueue(
        "reservation_dlq",
        this.deadLetterExchange,
        "expired.reservation"
      );

      // Handle reservation expiry
      // this.channel.consume("reservation_expiry", async (msg) => {
      //   if (msg) {
      //     try {
      //       const { jamRoomId, date, slots } = JSON.parse(
      //         msg.content.toString()
      //       );
      //       this.releaseReservation(jamRoomId, date, slots);
      //       this.channel.ack(msg);
      //     } catch (error) {
      //       // Reject the message, don't requeue - it will go to DLQ
      //       this.channel.nack(msg, false, false);
      //     }
      //   }
      // });

      // Handle dead letter messages
      this.channel.consume("reservation_dlq", async (msg) => {
        if (msg) {
          try {
            const reservation = JSON.parse(msg.content.toString());
            console.log("Processing dead letter message:", reservation);

            // Implement recovery logic here
            await this.handleFailedReservation(reservation);

            this.channel.ack(msg);
          } catch (error) {
            console.error("Error processing DLQ message:", error);
            // In DLQ, we might want to log the error and ack anyway
            this.channel.ack(msg);
          }
        }
      });

      console.log("RabbitMQ Connected with DLX configuration");
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
      expiresAt: Date.now() + 5 * 60 * 1000, // 10 minutes
    };

    // Store in memory
    if (!this.tempReservations.has(key)) {
      this.tempReservations.set(key, new Map());
    }
    const roomReservations = this.tempReservations.get(key);

    // Check for slot and addon conflicts
    for (const slot of slots) {
      if (this.isSlotReserved(jamRoomId, date, slot.slotId)) {
        return { success: false, message: "Some slots are already reserved" };
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
    this.channel.publish(
      this.mainExchange,
      "new.reservation",
      Buffer.from(JSON.stringify(expiryMsg)),
      {
        persistent: true,
        expiration: "300000", // 5 minutes
      }
    );

    return { success: true, expiresAt: reservation.expiresAt };
  }

  getReservedAddonCount(jamRoomId, date, addonId) {
    const key = `${jamRoomId}-${date}`;
    const roomReservations = this.tempReservations.get(key);
    if (!roomReservations) return 0;

    let count = 0;
    for (const [key, reservation] of roomReservations.entries()) {
      if (
        key.startsWith("addon-") &&
        key.includes(addonId) &&
        reservation.expiresAt > Date.now()
      ) {
        count++;
      }
    }
    return count;
  }

  // Add method to handle failed reservations
  async handleFailedReservation(reservation) {
    try {
      // Implement recovery logic
      // For example: notify admin, log to database, or attempt cleanup
      console.log("Handling failed reservation:", reservation);

      // You might want to store failed reservations in a separate collection
      // await FailedReservation.create(reservation);

      // Force release the reservation if it's still in memory
      this.releaseReservation(
        reservation.jamRoomId,
        reservation.date,
        reservation.slots
      );
    } catch (error) {
      console.error("Error handling failed reservation:", error);
    }
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
