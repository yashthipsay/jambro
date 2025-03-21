const express = require('express');
const router = express.Router();
const {
  purchaseSubscription,
  verifySubscriptionPayment,
  cancelSubscription,
updateSubscription,
getUserSubscription,
createPlan
} = require('../../controller/subscriptions/subscriptionController');

// Subscription management routes
router.post('/purchase', purchaseSubscription);
router.post('/verify-payment', verifySubscriptionPayment);
router.post('/cancel', cancelSubscription);
router.post('/update', updateSubscription);
router.get('/user/:userId', getUserSubscription);
router.post('/create-plan', createPlan);

module.exports = router;