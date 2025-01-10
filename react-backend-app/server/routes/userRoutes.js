const express = require('express');
const router = express.Router();
const { createUser, getUserByEmail, savePhoneNumber, deletePhoneNumber } = require('../controller/userController');

router.post('/register', createUser);
router.post('/', getUserByEmail);
router.post('/save-number', savePhoneNumber);
router.post('/delete-number', deletePhoneNumber);

module.exports = router;