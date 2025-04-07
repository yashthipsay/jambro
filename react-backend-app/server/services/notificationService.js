const axios = require('axios');
require('dotenv').config();

const sendBookingNotification = async ({
  jamRoomId,
  jamRoomName,
  ownerOneSignalId,
  bookingId,
  bookingDate,
  slots
}) => {
  try {
    console.log('Starting notification send process...');
    console.log('OneSignal User ID:', ownerOneSignalId);

    // Format the time slots for display
    const formattedSlots = slots.map(slot => `${slot.startTime}-${slot.endTime}`).join(', ');
    
    // Format the date for display
    const date = new Date(bookingDate).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short', 
      day: 'numeric'
    });

    const response = await axios.post(
      'https://onesignal.com/api/v1/notifications',
      {
        app_id: process.env.ONESIGNAL_APP_ID,
        include_player_ids: [ownerOneSignalId],
        contents: { 
          en: `New booking for ${jamRoomName} on ${date} for slots: ${formattedSlots}`
        }
      },
      {
        headers: {
          'Authorization': `Basic ${process.env.ONESIGNAL_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('OneSignal Response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error details:', error.response?.data || error.message);
    console.error('Full error:', error);
    throw error;
  }
};

module.exports = { sendBookingNotification };
