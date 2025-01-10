const express = require('express');
const router = express.Router();
const { createUser, getUserByEmail, savePhoneNumber } = require('../controller/userController');

router.post('/register', createUser);
router.post('/', getUserByEmail);
router.post('/save-number', savePhoneNumber);

module.exports = router;