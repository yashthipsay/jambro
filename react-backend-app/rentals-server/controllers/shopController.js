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