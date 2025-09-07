import axios from 'axios';


const API_URL = 'https://robotapitest-in.borzodelivery.com/api/business/1.6';
const AUTH_TOKEN = process.env.BORZO_AUTH_TOKEN;


const api = axios.create({
baseURL: API_URL,
headers: { 'X-DV-Auth-Token': AUTH_TOKEN }
});


export default {
calculatePrice: async (data) => {
const res = await api.post('/calculate-order', data);
return res.data;
},


createOrder: async (data) => {
const res = await api.post('/create-order', data);
return res.data;
},


getBooking: async (bookingId) => {
// Replace with DB fetch if booking is internal
return { bookingId, status: 'PENDING_APPROVAL' };
},


approveBooking: async (bookingId) => {
// Update DB status
return { bookingId, status: 'APPROVED' };
},


createShipment: async (data) => {
const res = await api.post('/create-order', data);
return res.data;
},


getTracking: async (orderId) => {
const res = await api.get(`/order/${orderId}`);
return res.data;
},


requestReturn: async (orderId) => {
const res = await api.post(`/order/${orderId}/return`);
return res.data;
}
};

export const borzoService = {
  async getOrderStatus(orderId) {
    const res = await axios.get(
      `https://robotapitest-in.borzodelivery.com/api/business/1.6/orders?order_id=${orderId}`,
      {
        headers: {
          "X-DV-Auth-Token": process.env.BORZO_AUTH_TOKEN,
        },
      }
    );
    return res.data;
  },
};
