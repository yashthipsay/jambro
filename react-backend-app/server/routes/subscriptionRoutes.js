const express = require('express');
const router = express.Router();
const { 
  adminCreateSubscriptionPlan, 
  adminUpdateSubscriptionPlan,
  adminDeleteSubscriptionPlan,
  adminGetAllSubscriptionPlans,
  purchaseSubscription,
  cancelSubscription,
  refundSubscription,
  getUserSubscriptions,
  handleSubscriptionRenewal,
  handleSubscriptionExpiration
} = require('../controller/subscriptionController');

const { 
  validateCreatePlan, 
  validateUpdatePlan, 
  validatePurchase, 
  validateCancel,
  validateGetUserSubscriptions
} = require('../middleware/subscriptionValidation');

const { isAuthenticated, isAdmin } = require('../middleware/adminAuth');

// Admin routes
router.post('/plans', isAuthenticated, isAdmin, validateCreatePlan, adminCreateSubscriptionPlan);
router.put('/plans/:planId', isAuthenticated, isAdmin, validateUpdatePlan, adminUpdateSubscriptionPlan);
router.delete('/plans/:planId', isAuthenticated, isAdmin, adminDeleteSubscriptionPlan);
router.get('/plans', isAuthenticated, isAdmin, adminGetAllSubscriptionPlans);

// User routes
router.post('/purchase', isAuthenticated, validatePurchase, purchaseSubscription);
router.post('/cancel/:subscriptionId', isAuthenticated, validateCancel, cancelSubscription);
router.post('/refund/:subscriptionId', isAuthenticated, validateCancel, refundSubscription);
router.get('/user/:userId', isAuthenticated, validateGetUserSubscriptions, getUserSubscriptions);

// System routes (typically called by webhooks or cron jobs)
router.post('/renewal/:subscriptionId', handleSubscriptionRenewal);
router.post('/expiration/:subscriptionId', handleSubscriptionExpiration);

module.exports = router;