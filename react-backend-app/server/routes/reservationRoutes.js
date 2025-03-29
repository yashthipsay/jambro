const express = require("express");
const router = express.Router();
const rabbitmqService = require("../services/rabbitmqService");
const Booking = require("../models/BookingSchema");

const createReservationRouter = (io) => {
  router.post("/create", async (req, res) => {
    try {
      const { jamRoomId, date, slots, selectedAddons, userId } = req.body;

      // Check permanent bookings first
      const existingBooking = await Booking.findOne({
        jamRoom: jamRoomId,
        date: date,
        "slots.slotId": { $in: slots.map((s) => s.slotId) },
        status: { $ne: "TERMINATED" },
      });

      if (existingBooking) {
        return res.json({
          success: false,
          message: "One or more slots are already booked",
        });
      }

      // Then check temporary reservations
      const key = `${jamRoomId}-${date}`;
      const roomReservations =
        rabbitmqService.tempReservations.get(key) || new Map();

      // Check if any slot is already reserved by someone else
      for (const slot of slots) {
        const slotKey = `slot-${slot.slotId}`;
        const existingReservation = roomReservations.get(slotKey);
        if (
          existingReservation &&
          existingReservation.userId !== userId &&
          existingReservation.expiresAt > Date.now()
        ) {
          return res.json({
            success: false,
            message: "One or more slots are already reserved",
          });
        }
      }

      const result = await rabbitmqService.createReservation(
        jamRoomId,
        date,
        slots,
        selectedAddons,
        userId
      );

      if (result.success) {
        io.emit("reservationUpdate", {
          jamRoomId,
          date,
          reservations: {
            slots: slots.map((slot) => ({
              slotId: slot.slotId,
              userId,
            })),
            addons: selectedAddons.map((addon) => ({
              addonId: addon.addonId,
              userId,
            })),
          },
        });
      }

      res.json(result);
    } catch (error) {
      console.error("Create reservation error:", error);
      res.status(500).json({
        success: false,
        message: "Error creating reservation",
      });
    }
  });

  router.post("/release", async (req, res) => {
    try {
      const { jamRoomId, date, slots } = req.body;

      rabbitmqService.releaseReservation(jamRoomId, date, slots);

      // Emit update to all clients
      io.emit("reservationUpdate", {
        jamRoomId,
        date,
        reservations: {
          slots: [],
          addons: [],
        },
      });

      res.json({ success: true });
    } catch (error) {
      console.error("Release reservation error:", error);
      res.status(500).json({
        success: false,
        message: "Error releasing reservation",
      });
    }
  });

  router.post("/extend", async (req, res) => {
    try {
      const { jamRoomId, date, slots, additionalMinutes } = req.body;

      const result = await rabbitmqService.extendReservation(
        jamRoomId,
        date,
        slots,
        additionalMinutes
      );

      if (result.success) {
        io.emit("reservationUpdate", {
          jamRoomId,
          date,
          reservations: {
            slots: slots.map((slot) => ({
              slotId: slot.slotId,
              expiresAt: result.expiresAt,
            })),
          },
        });
      }

      res.json(result);
    } catch (error) {
      console.error("Extend reservation error:", error);
      res.status(500).json({
        success: false,
        message: "Error extending reservation",
      });
    }
  });

  router.get("/check/:jamRoomId/:date", async (req, res) => {
    try {
      const { jamRoomId, date } = req.params;
      const key = `${jamRoomId}-${date}`;
      const roomReservations =
        rabbitmqService.tempReservations.get(key) || new Map();

      // Add permanent bookings check
      const permanentBookings = await Booking.find({
        jamRoom: jamRoomId,
        date: date,
        status: { $ne: "TERMINATED" },
      });

      const reservations = {
        slots: [],
        addons: [],
      };

      // Add temporary reservations
      for (const [key, reservation] of roomReservations.entries()) {
        if (reservation.expiresAt <= Date.now()) continue;

        if (key.startsWith("slot-")) {
          reservations.slots.push({
            slotId: key.split("-")[1],
            userId: reservation.userId,
          });
        } else if (key.startsWith("addon-")) {
          reservations.addons.push({
            addonId: key.split("-")[1],
            userId: reservation.userId,
          });
        }
      }

      // Add permanent bookings to reservations
      permanentBookings.forEach((booking) => {
        booking.slots.forEach((slot) => {
          reservations.slots.push({
            slotId: slot.slotId,
            userId: booking.user,
          });
        });
      });

      res.json({ success: true, reservations });
    } catch (error) {
      console.error("Reservation check error:", error);
      res
        .status(500)
        .json({ success: false, message: "Error checking reservations" });
    }
  });

  return router;
};

module.exports = createReservationRouter;
