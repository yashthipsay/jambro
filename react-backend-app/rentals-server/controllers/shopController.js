import RentalShop from "../models/RentalsShops.js";

// POST /api/shops
export const createShop = async (req, res) => {
  try {
    const { name, contact, pickup_address } = req.body;
    const shop = new RentalShop({
      name,
      contact,
      pickup_address,
      borzo: { pickup_locations: [] },
      compliance: { documents: [] }
    });
    await shop.save();
    res.status(201).json({ success: true, shop });
  } catch (err) {
    console.error("createShop error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
};

// GET /api/shops
export const getShops = async (_req, res) => {
  try {
    const shops = await RentalShop.find();
    res.json(shops);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getShop = async (req, res) => {
  try {
    const shop = await RentalShop.findById(req.params.shopId);
    if (!shop) return res.status(404).json({ error: "Shop not found" });
    res.json(shop);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const addInstrument = async (req, res) => {
  try{
    const {
      owner_shop_id,
      type,
      name,
      description,
      price_per_day,
      images = [],
      shipping_details = {},
      kyc_requirements = {},
      compliance_flags = {}
    } = req.body;

    // Validate shop exists
    const shop = await RentalShop.findById(owner_shop_id);
    if (!shop) {
      return res.status(404).json({
        success: false,
        error: "Shop not found"
      });
    }

    const instrument = new RentalInstrument({
      owner_shop_id,
      type,
      name,
      description,
      price_per_day,
      images,
      tags,
      availability_status: "available",
      shipping_details: {
        weight_kg: shipping_details.weight_kg,
        length_cm: shipping_details.length_cm,
        width_cm: shipping_details.width_cm,
        height_cm: shipping_details.height_cm,
        fragile: shipping_details.fragile || false,
        declared_value: shipping_details.declared_value,
        hsn_code: shipping_details.hsn_code
      },
      kyc_requirements: {
        requires_user_kyc: kyc_requirements.requires_user_kyc || false,
        acceptable_docs: kyc_requirements.acceptable_docs || []
      },
      compliance_flags: {
        is_verified: compliance_flags.is_verified || false,
        notes: compliance_flags.notes
      }
    });

    await instrument.save();

    res.status(201).json({
      success: true,
      instrument
    });
  } catch (err) {
    console.error("Add instrument error:", err);
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
}

/**
 * PUT /api/instruments/:instrumentId
 * Update an existing instrument
 */
export const updateInstrument = async (req, res) => {
  try{
    const { instrumentId } = req.params;
    const updateData = req.body;

    // Find instrument by ID
    const instrument = await RentalInstrument.findById(instrumentId);
    if (!instrument) {
      return res.status(404).json({
        success: false,
        error: "Instrument not found"
      });
    }

    const allowedUpdates = [
      "description",
      "availability_status",
      "price_per_day",
      "compliance_flags",
      "shipping_details",
      "images",
      "tags"
    ];

    // Filler to only allowed updates
    const filteredUpdates = Object.keys(updateData)
      .filter(key => allowedUpdates.includes(key))
      .reduce((obj, key) => {
        obj[key] = updateData[key];
        return obj;
      }, {});

    const updatedInstrument = await RentalInstrument.findByIdAndUpdate(
      instrumentId,
      { $set: filteredUpdates },
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      instrument: updatedInstrument
    });
  } catch (err) {
    console.error("Update instrument error:", err);
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
}

/**
 * DELETE /api/instruments/:instrumentId
 * Delete an instrument
 */
export const deleteInstrument = async(req, res) => {
  try {
    const {instrumentId} = req.params;

    // Find instrument and validate ownership
    const instrument = await RentalInstrument.findById(instrumentId);
    if (!instrument) {
      return res.status(404).json({ success: false, error: "Instrument not found" });
    }

    await RentalInstrument.findByIdAndDelete(instrumentId);

    res.json({ success: true, message: "Instrument deleted" });
  } catch (err) {
    console.error("Delete instrument error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
};