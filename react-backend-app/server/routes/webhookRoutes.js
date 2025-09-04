// src/routes/webhooksRoutes.js
const router = require('express').Router();
const webhooks = require('../controllers/webhooksController');

router.post('/razorpay', webhooks.razorpayWebhook);
router.post('/delhivery', webhooks.delhiveryWebhook); // if using aggregator/webhook
module.exports = router;
