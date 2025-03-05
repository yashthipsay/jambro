const { body, param, validationResult } = require('express-validator');

// Helper function to check validation results
const validateResults = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }
    next();
  };

//   Validate plan creation
  const validateCreatePlan = [

  ]


//   Validate plan update
    const validateUpdatePlan = [
    
    ]

//   Validate plan cancellation
    const validateCancel = [
    
    ]

// Validate getting user subscriptions
const validateGetUserSubscriptions = [
    param('userId').isMongoId().withMessage('Valid user ID is required'),
    validateResults
  ];


  module.exports = {
    validateCreatePlan,
    validateUpdatePlan,
    validatePurchase,
    validateCancel,
    validateGetUserSubscriptions
  };