let io;
function init(ioInstance) { io = ioInstance; }
function joinBookingRoom(socket, bookingId) { socket.join(`booking:${bookingId}`); }
function emitShipmentUpdate(bookingId, payload) { if (io) io.to(`booking:${bookingId}`).emit('shipment_update', payload); }
function emitStatusChange(bookingId, payload) { if (io) io.to(`booking:${bookingId}`).emit('status_change', payload); }
module.exports = { init, joinBookingRoom, emitShipmentUpdate, emitStatusChange };
