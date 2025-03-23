const { SKU } = require("../../models/subscriptions/SubscriptionSchema");
const { v4: uuidv4 } = require("uuid");

const createSKU = async (req, res) => {
  try {
    const { name, description, price, duration, hoursPerMonth, accessType } =
      req.body;

    // Create new SKU - admin auth to be added later
    const sku = new SKU({
      skuId: uuidv4(),
      name,
      description,
      price,
      duration, // numeric value representing months
      hoursPerMonth,
      accessType, // must be one of ['JAM_ROOM', 'STUDIO', 'BOTH']
      isActive: true,
    });

    await sku.save();

    res.status(201).json({
      success: true,
      message: "SKU created successfully",
      data: sku,
    });
  } catch (error) {
    console.error("Error creating SKU:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const getSKUs = async (req, res) => {
  try {
    const skus = await SKU.find({ isActive: true });
    
    res.json({
      success: true,
      data: skus
    });
  } catch (error) {
    console.error("Error fetching SKUs:", error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

const updateSKU = async (req, res) => {
  try {
    // Assume skuId is provided in req.params
    const { skuId } = req.params;
    const updateData = req.body; // fields to update

    const updatedSKU = await SKU.findOneAndUpdate({ skuId }, updateData, {
      new: true,
    });

    if (!updatedSKU) {
      return res.status(404).json({
        success: false,
        message: "SKU not found",
      });
    }

    res.json({
      success: true,
      message: "SKU updated successfully",
      data: updatedSKU,
    });
  } catch (error) {
    console.error("Error updating SKU:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const deleteSKU = async (req, res) => {
  try {
    // Assume skuId is provided in req.params
    const { skuId } = req.params;

    const deletedSKU = await SKU.findOneAndDelete({ skuId });
    if (!deletedSKU) {
      return res.status(404).json({
        success: false,
        message: "SKU not found",
      });
    }

    res.json({
      success: true,
      message: "SKU deleted successfully",
      data: deletedSKU,
    });
  } catch (error) {
    console.error("Error deleting SKU:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  createSKU,
  getSKUs,
  updateSKU,
  deleteSKU,
};
