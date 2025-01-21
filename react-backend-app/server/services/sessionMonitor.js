const cron = require('node-cron');
const moment = require('moment-timezone');
const BookingSchema = require('../models/BookingSchema');
const { createRazorpayPayout } = require('../controller/payoutsController');

class SessionMonitor {
  constructor(io) {
      this.io = io;
  }

  start() {
    console.log('Session monitor started');
   // Check every minute
  cron.schedule('* * * * *', async () => {
      await this.checkSessions();
    });
  }

  async checkSessions() {
    const currentDate = moment().tz('Asia/Kolkata'); // Set your desired timezone
    console.log('Current Date:', currentDate.format());

    const bookings = await BookingSchema.find({
      status: { $ne: 'COMPLETED' }
      }).populate('jamRoom');

    for(const booking of bookings) {
      console.log(`Fund account id: ${booking.jamRoom.bankValidationData.fund_account.id}`);
      const bookingDate = moment(booking.date).tz('Asia/Kolkata').startOf('day');
            // Sort slots by start time
            booking.slots.sort((a, b) => {
              const aStart = moment(a.startTime, 'HH:mm');
              const bStart = moment(b.startTime, 'HH:mm');
              return aStart - bStart;
            });

                // Get earliest start time and latest end time
      const startTimes = booking.slots.map(slot => {
        const [hours, minutes] = slot.startTime.split(':');
        return bookingDate.clone().set({ hour: parseInt(hours), minute: parseInt(minutes) });
      });

      const endTimes = booking.slots.map(slot => {
        const [hours, minutes] = slot.endTime.split(':');
        return bookingDate.clone().set({ hour: parseInt(hours), minute: parseInt(minutes) });
      });

      const earliestStart = moment.min(startTimes);
      const latestEnd = moment.max(endTimes);

      if (currentDate.isBetween(earliestStart, latestEnd) && booking.status === 'NOT_STARTED') {
        // Update to ONGOING
        booking.status = 'ONGOING';
        await booking.save();
        this.io.emit('sessionStatusUpdate', { 
          bookingId: booking._id,
          status: 'ONGOING' 
        });
        console.log(`Booking ${booking._id} status updated to ONGOING`);
      } 
      else if (currentDate.isAfter(latestEnd) && booking.status === 'ONGOING') {
        // Update to COMPLETED and trigger payout
        booking.status = 'COMPLETED';
        await booking.save();
        this.io.emit('sessionStatusUpdate', { 
          bookingId: booking._id,
          status: 'COMPLETED' 
        });
        console.log(`Booking ${booking._id} status updated to COMPLETED`);

        // Trigger payout
        await this.processPayout(booking);
      }
    }
  }

  async processPayout(booking) {
      try {

        if (!booking.totalAmount || isNaN(booking.totalAmount)) {
          throw new Error('Invalid totalAmount in booking');
        }

        // Calculate amount (assuming feesPerSlot is stored in jamRoom)
        const amount = booking.totalAmount // 80% of the total amount
        
        await createRazorpayPayout({
          body: {
            jamroomId: booking.jamRoom._id,
            fund_account_id: booking.jamRoom.bankValidationData.fund_account.id,
            amount: amount,
            purpose: 'payout',
            paymentId: booking.paymentId
          }
        }, {
          json: () => {},
          status: () => {}
        });
        console.log(`Payout processed for booking ${booking._id}`);
      } catch (error) {
        console.error('Payout processing error:', error);
      }
  }
}

module.exports = SessionMonitor;