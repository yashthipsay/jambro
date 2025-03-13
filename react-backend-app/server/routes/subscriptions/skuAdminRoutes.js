const express = require("express");
const router = express.Router();
const { createSKU, updateSKU, deleteSKU } = require("../../controller/adminFunctions/skuController");

// Route to create a new SKU
router.post("/", createSKU);

// Route to update an existing SKU (skuId provided as URL parameter)
router.put("/:skuId", updateSKU);

// Route to delete an SKU (skuId provided as URL parameter)
router.delete("/:skuId", deleteSKU);

module.exports = router;