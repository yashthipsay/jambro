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
        'slots.status': { $ne: 'COMPLETED' }
      }).populate('jamRoom');

    for(const booking of bookings) {
        for(const slot of booking.slots) {
            const [hours, minutes] = slot.startTime.split(':');
            const [endHours, endMinutes] = slot.endTime.split(':');

            const slotStartTime = moment(booking.date).tz('Asia/Kolkata').set({ hour: parseInt(hours), minute: parseInt(minutes) });
            const slotEndTime = moment(booking.date).tz('Asia/Kolkata').set({ hour: parseInt(endHours), minute: parseInt(endMinutes) });

            console.log(`Booking ID: ${booking._id}, Slot ID: ${slot.slotId}`);
            console.log('Slot Start Time:', slotStartTime.format());
            console.log('Slot End Time:', slotEndTime.format());
            console.log('Slot Status:', slot.status);

            if (currentDate.isBetween(slotStartTime, slotEndTime) && slot.status === 'NOT_STARTED') {
                // Update to ONGOING
                slot.status = 'ONGOING';
                await booking.save();
                this.io.emit('sessionStatusUpdate', { 
                  bookingId: booking._id, 
                  slotId: slot.slotId, 
                  status: 'ONGOING' 
                });
                console.log(`Slot ${slot.slotId} status updated to ONGOING`);
            } else if (currentDate.isAfter(slotEndTime) && slot.status === 'ONGOING') {
                // Update to COMPLETED and trigger payout
                slot.status = 'COMPLETED';
                await booking.save();
                this.io.emit('sessionStatusUpdate', { 
                  bookingId: booking._id, 
                  slotId: slot.slotId, 
                  status: 'COMPLETED' 
                });
                console.log(`Slot ${slot.slotId} status updated to COMPLETED`);

                // Trigger payout
                await this.processPayout(booking);
            }
        }
    }
  }

  async processPayout(booking) {
      try {
        // Calculate amount (assuming feesPerSlot is stored in jamRoom)
        const amount = booking.totalAmount * 0.8; // 80% of the total amount
        
        await createRazorpayPayout({
          body: {
            jamroomId: booking.jamRoom._id,
            fund_account_id: booking.jamRoom.bankValidationData.fund_account_id,
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