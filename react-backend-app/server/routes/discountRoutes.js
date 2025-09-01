const express = require("express");
const router = express.Router();
const { evaluateDiscounts } = require("../services/discountController");

router.post("/evaluate", evaluateDiscounts);

module.exports = router;