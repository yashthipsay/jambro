// src/workers/trackingPoller.js (run via cron/pm2)
const RentalBooking = require('../models/RentalBooking');
const { trackAwb } = require('../services/delhiveryService');
const ws = require('../services/websocket');

async function poll() {
  const inFlight = await RentalBooking.find({ 'shipment.awb': { $ne: null }, status: { $in: ['pickup_scheduled','in_transit','ready_to_ship'] } });
  for (const b of inFlight) {
    try {
      const data = await trackAwb(b.shipment.awb);
      const status = data?.ShipmentData?.Shipment?.Status?.Status || 'in_transit';
      if (status && status !== b.shipment.tracking_status) {
        b.shipment.tracking_status = status;
        b.shipment.last_tracked_at = new Date();
        if (status.toLowerCase().includes('out for delivery')) b.status = 'in_transit';
        if (status.toLowerCase().includes('delivered')) b.status = 'delivered';
        await b.save();
        ws.emitShipmentUpdate(b._id, { awb: b.shipment.awb, status });
        ws.emitStatusChange(b._id, { status: b.status });
      }
    } catch (e) { /* log */ }
  }
}
module.exports = { poll };
