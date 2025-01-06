const express = require('express');
const router = express.Router();
const { createUser, getUserByEmail } = require('../controller/userController');

router.post('/register', createUser);
router.post('/', getUserByEmail);

module.exports = router;