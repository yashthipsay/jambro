const moment = require("moment-timezone");
const Booking = require("../models/BookingSchema");

async function evaluateDiscounts(req, res) {
  try {
    const { userId, jamRoomId, date, slots = [], totalAmount = 0, couponCode } = req.body;

    if (!userId || !jamRoomId || !date || !Array.isArray(slots) || typeof totalAmount !== "number") {
      return res.status(400).json({ success: false, message: "Invalid payload" });
    }

    // Determine earliest slot time from provided slots
    const earliestSlot = slots.reduce((earliest, s) => {
      const [h, m] = (s.startTime || "00:00").split(":").map(Number);
      const slotMoment = moment.tz(date, "YYYY-MM-DD", "Asia/Kolkata").set({ hour: h, minute: m, second: 0, millisecond: 0 });
      return earliest ? (slotMoment.isBefore(earliest) ? slotMoment : earliest) : slotMoment;
    }, null);

    // User’s historical bookings for welcome/loyalty
    const userBookingsCount = await Booking.countDocuments({
    user: userId,
    status: "COMPLETED",
    });

    // Time-based helpers
    const now = moment.tz("Asia/Kolkata");
    const bookingDay = moment.tz(date, "YYYY-MM-DD", "Asia/Kolkata");
    const isWeekday = [1, 2, 3, 4, 5].includes(bookingDay.day()); // Mon-Fri

    const hoursDiff = earliestSlot ? earliestSlot.diff(now, "hours") : null;
    const daysDiff = bookingDay.diff(now.startOf("day"), "days");

    // Base rule config
    const rules = [
      {
        id: "WELCOME_15",
        label: "Welcome Offer (15%)",
        stackable: true,
        percent: 0.15,
        applies: () => userBookingsCount === 0,
      },
      {
        id: "BULK_10",
        label: "Bulk Booking (10%)",
        stackable: true,
        percent: 0.10,
        applies: () => slots.length >= 4,
      },
      {
        id: "OFF_PEAK_10",
        label: "Off-peak (10%)",
        stackable: true,
        percent: 0.10,
        applies: () => {
          if (!earliestSlot) return false;
          const hour = earliestSlot.hour();
          return isWeekday && hour < 12; // weekday mornings
        },
      },
      {
        id: "EARLY_BIRD_5",
        label: "Early Bird (5%)",
        stackable: true,
        percent: 0.05,
        applies: () => daysDiff >= 7,
      },
      {
        id: "LAST_MINUTE_20",
        label: "Last Minute (20%)",
        stackable: false, // don’t stack this with others
        percent: 0.20,
        applies: () => hoursDiff !== null && hoursDiff <= 6 && hoursDiff >= 0,
      },
    ];

    // Coupon codes (example set)
    const couponRules = {
      ROCKSTAR20: { id: "COUPON_ROCKSTAR_20", label: "Coupon ROCKSTAR20 (20%)", stackable: false, percent: 0.20 },
      WELCOME15: { id: "COUPON_WELCOME_15", label: "Coupon WELCOME15 (15%)", stackable: true, percent: 0.15 },
      BULK15: { id: "COUPON_BULK_15", label: "Coupon BULK15 (15%)", stackable: true, percent: 0.15 },
    };

    if (couponCode && couponRules[couponCode?.toUpperCase()]) {
      rules.push({
        ...couponRules[couponCode.toUpperCase()],
        applies: () => true,
      });
    }

    // Evaluate rules
    let applied = [];
    let percentSum = 0;

    // Priority: last-minute (non-stackable) wins alone if applicable
    const lastMinuteRule = rules.find((r) => r.id === "LAST_MINUTE_20");
    if (lastMinuteRule && lastMinuteRule.applies()) {
      applied = [lastMinuteRule];
      percentSum = lastMinuteRule.percent;
    } else {
      for (const rule of rules) {
        if (!rule.applies()) continue;
        if (!rule.stackable && applied.length > 0) {
          // skip non-stackable when others already applied
          continue;
        }
        applied.push(rule);
      }
      percentSum = applied.reduce((p, r) => p + r.percent, 0);
    }

    // Cap total discount at 25%
    const maxDiscountPercent = 0.25;
    const effectivePercent = Math.min(percentSum, maxDiscountPercent);
    const discountAmount = Math.round(totalAmount * effectivePercent);
    const discountedTotal = Math.max(0, totalAmount - discountAmount);

    return res.json({
      success: true,
      data: {
        appliedDiscounts: applied.map((a) => ({ id: a.id, label: a.label, percent: a.percent })),
        totalDiscountPercent: effectivePercent,
        discountAmount,
        discountedTotal,
      },
    });
  } catch (err) {
    console.error("evaluateDiscounts error:", err);
    return res.status(500).json({ success: false, message: "Failed to evaluate discounts" });
  }
}

module.exports = {
  evaluateDiscounts,
};