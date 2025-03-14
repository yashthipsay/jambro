const express = require('express');
const router = express.Router();
const {
  purchaseSubscription,
  verifySubscriptionPayment,
  cancelSubscription,
updateSubscription,
getUserSubscription
} = require('../../controller/subscriptions/subscriptionController');

// Subscription management routes
router.post('/purchase', purchaseSubscription);
router.post('/verify-payment', verifySubscriptionPayment);
router.post('/cancel', cancelSubscription);
router.post('/update', updateSubscription);
router.get('/user/:userId', getUserSubscription);

module.exports = router;