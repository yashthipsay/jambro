const express = require('express');
const router = express.Router();
const { checkout, paymentVerification, getInvoice } = require('../controller/paymentController');

router.route("/checkout").post(checkout);
router.route('/verify').post(paymentVerification);
router.get('/invoices/:id', getInvoice);

module.exports = router;