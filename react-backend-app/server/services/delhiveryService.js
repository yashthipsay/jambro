const dlv = require('../utils/delhiveryInstance');

// Create shipment/order and fetch AWB/label (shape depends on Delhivery product)
async function createShipment({ orderId, pickup, drop, packageInfo }) {
  // Example: placeholder payload; adjust per Delhivery One docs
  const payload = {
    shipments: [{
      order: orderId,
      waybill: '',
      shipment_length: packageInfo.length_cm,
      shipment_width: packageInfo.width_cm,
      shipment_height: packageInfo.height_cm,
      weight: packageInfo.weight_kg,
      cod_amount: 0,
      declared_value: packageInfo.declared_value,
      consignee: {
        name: drop.name,
        add: drop.address,
        pin: drop.pincode,
        city: drop.city,
        state: drop.state,
        phone: drop.phone
      },
      pickup_location: pickup.code
    }]
  };
  const { data } = await dlv.post('/api/cmu/create.json', payload); // endpoint varies per account/product
  return data;
}

// Schedule pickup via Pickup Request API
async function schedulePickup({ pickupCode, date, timeSlot, shipmentCount }) {
  const payload = { pickup_location: pickupCode, pickup_date: date, time_slot: timeSlot, shipment_count: shipmentCount };
  const { data } = await dlv.post('/api/pickup', payload);
  return data;
}

// Fetch tracking status (poller)
async function trackAwb(awb) {
  const { data } = await dlv.get(`/api/v1/packages/json/?waybill=${awb}`);
  return data;
}

module.exports = { createShipment, schedulePickup, trackAwb };
