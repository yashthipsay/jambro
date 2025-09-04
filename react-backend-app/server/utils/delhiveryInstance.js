const axios = require('axios');
const dlv = axios.create({
  baseURL: process.env.DELHIVERY_BASE_URL || 'https://track.delhivery.com',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Token ${process.env.DELHIVERY_TOKEN}`
  }
});
module.exports = dlv;