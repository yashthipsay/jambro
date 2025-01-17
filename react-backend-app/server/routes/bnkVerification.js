const express = require('express');
const router = express.Router();
const { verifyBankAccount } = require('../controller/bankAccountVerification');

router.post('/verify', verifyBankAccount);

module.exports = router;