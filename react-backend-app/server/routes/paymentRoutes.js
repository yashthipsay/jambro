const express = require('express');
const router = express.Router();
const { checkout } = require('../controller/paymentController');

router.route("/checkout").post(checkout);

module.exports = router;