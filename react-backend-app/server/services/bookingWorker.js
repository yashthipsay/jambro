const BookingSchema = require("../models/BookingSchema");
const JamRoomSchema = require("../models/JamRooms");
const mongoose = require("mongoose");
const { connectRabbitMQ } = require("./rabbitmqService");

const startBookingWorker = async () => {
  try {
    const channel = await connectRabbitMQ();

    console.log("Booking worker is waiting for messages...");

    // Process bookings
    channel.consume("bookingQueue", async (msg) => {
      if (msg !== null) {
        const bookingData = JSON.parse(msg.content.toString());
        try {
          // Start a MongoDB session for transaction support
          const session = await mongoose.startSession();
          await session.withTransaction(async () => {
            const { userId, jamRoomId, date, slots, totalAmount, paymentId } =
              bookingData;

            // Verify all slots are still reserved for this user
            const jamRoom = await JamRoomSchema.findById(jamRoomId).session(
              session
            );

            if (!jamRoom) {
              throw new Error("Jam Room not found");
            }

            // Check each slot to ensure it's still reserved for this user
            for (const slot of slots) {
              const jamRoomSlot = jamRoom.slots.find(
                (s) => s.slotId === slot.slotId
              );

              if (
                !jamRoomSlot ||
                jamRoomSlot.isBooked ||
                (jamRoomSlot.reservedBy &&
                  jamRoomSlot.reservedBy.toString() !== userId &&
                  jamRoomSlot.reservationExpires > new Date())
              ) {
                throw new Error(
                  `Slot ${slot.slotId} is already booked or reserved by another user`
                );
              }
            }

            // Create the booking
            const newBooking = new BookingSchema({
              user: userId,
              jamRoom: jamRoomId,
              date,
              slots,
              totalAmount,
              paymentId,
              status: "NOT_STARTED",
            });

            await newBooking.save({ session });

            // Update slots in the jam room to be fully booked (not just reserved)
            for (const slot of slots) {
              await JamRoomSchema.updateOne(
                {
                  _id: jamRoomId,
                  "slots.slotId": slot.slotId,
                },
                {
                  $set: {
                    "slots.$.isBooked": true,
                    "slots.$.bookedBy": userId,
                    "slots.$.reservedBy": null,
                    "slots.$.reservationExpires": null,
                  },
                },
                { session }
              );
            }
          });

          // Acknowledge the message
          channel.ack(msg);
          console.log(`Booking processed for user ${bookingData.userId}`);
        } catch (error) {
          console.error("Error processing booking:", error);
          // Reject the message
          channel.nack(msg, false, false);

          // If there's an error, release the reservation
          try {
            for (const slot of bookingData.slots) {
              await releaseSlotReservation(bookingData.jamRoomId, slot.slotId);
            }
          } catch (releaseError) {
            console.error("Error releasing reservation:", releaseError);
          }
        }
      }
    });

    // Process reservations
    channel.consume("reservationQueue", async (msg) => {
      if (msg !== null) {
        const reservationData = JSON.parse(msg.content.toString());
        try {
          await processReservation(reservationData);
          channel.ack(msg);
        } catch (error) {
          console.error("Error processing reservation:", error);
          channel.nack(msg, false, false);
        }
      }
    });
  } catch (error) {
    console.error("Worker initialization error:", error);
    setTimeout(startBookingWorker, 5000);
  }
};

// Process a reservation request
const processReservation = async (reservationData) => {
  const { userId, jamRoomId, date, slotIds } = reservationData;
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now

  // Update each slot to be temporarily reserved
  for (const slotId of slotIds) {
    const result = await JamRoomSchema.findOneAndUpdate(
      {
        _id: jamRoomId,
        "slots.slotId": slotId,
        $or: [
          { "slots.isBooked": false, "slots.reservedBy": null },
          { "slots.reservedBy": userId },
          { "slots.reservationExpires": { $lt: new Date() } },
        ],
      },
      {
        $set: {
          "slots.$.reservedBy": userId,
          "slots.$.reservationExpires": expiresAt,
        },
      },
      { new: true }
    );

    if (!result) {
      throw new Error(
        `Slot ${slotId} is already booked or reserved by another user`
      );
    }
  }

  // Schedule automatic release of reservation after expiration
  setTimeout(async () => {
    try {
      for (const slotId of slotIds) {
        await releaseSlotReservation(jamRoomId, slotId, userId);
      }
    } catch (error) {
      console.error("Error releasing expired reservation:", error);
    }
  }, 10 * 60 * 1000); // 10 minutes

  return true;
};

// Function to release a reservation
const releaseSlotReservation = async (jamRoomId, slotId, userId = null) => {
  const query = {
    _id: jamRoomId,
    "slots.slotId": slotId,
  };

  // If userId is provided, only release if it's reserved by this user
  if (userId) {
    query["slots.reservedBy"] = userId;
  }

  await JamRoomSchema.updateOne(query, {
    $set: {
      "slots.$.reservedBy": null,
      "slots.$.reservationExpires": null,
    },
  });
};

module.exports = {
  startBookingWorker,
  processReservation,
  releaseSlotReservation,
};
