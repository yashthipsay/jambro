const express = require('express');
const router = express.Router();
const {
  purchaseSubscription,
  verifySubscriptionPayment,
  cancelSubscription,
  upgradeSubscription,
  downgradeSubscription
} = require('../../controller/subscriptions/subscriptionController');

// Subscription management routes
router.post('/purchase', purchaseSubscription);
router.post('/verify-payment', verifySubscriptionPayment);
router.post('/cancel', cancelSubscription);
router.post('/upgrade', upgradeSubscription);
router.post('/downgrade', downgradeSubscription);

module.exports = router;