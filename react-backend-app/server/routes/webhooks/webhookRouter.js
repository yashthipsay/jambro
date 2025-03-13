const express = require('express');
const router = express.Router();
const razorpayWebhooks = require('../../controller/webhooks/razorpayWebhooks');


// Webhook to handle subscription events
router.use('/razorpay', razorpayWebhooks);


module.exports = router;