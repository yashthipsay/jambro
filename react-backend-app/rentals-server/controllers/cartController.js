import Cart from '../models/RentalsCart.js';
import RentalInstrument from '../models/RentalInstruments.js';

class CartController {
  /**
   * GET /api/cart/:userId
   * Load user's cart from database
   */
  static async loadCart(req, res) {
    try {
      const { userId } = req.params;
      
      let cart = await Cart.findOne({ userId }).populate('items.instrumentId');
      
      if (!cart) {
        cart = new Cart({ 
          userId,
          items: [],
          vendorConstraint: {}
        });
        await cart.save();
      }

      // Clean expired items
      const now = new Date();
      const originalCount = cart.items.length;
      cart.items = cart.items.filter(item => 
        !item.availabilityExpires || item.availabilityExpires > now
      );

      if (cart.items.length !== originalCount) {
        await cart.save();
      }

      res.json({
        success: true,
        data: cart.items, // Changed from cart.items to match frontend expectation
        cart: {
          items: cart.items,
          vendorConstraint: cart.vendorConstraint,
          lastSyncedAt: cart.lastSyncedAt
        }
      });
    } catch (error) {
      console.error('Load cart error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * POST /api/cart/:userId/sync
   * Sync cart state (full replacement or merge)
   */
  static async syncCart(req, res) {
    try {
      const { userId } = req.params;
      const { items, vendorConstraint, operation = 'replace' } = req.body;

      console.log('Sync cart request:', { userId, itemCount: items?.length, operation });

      let cart = await Cart.findOne({ userId });
      
      if (!cart) {
        cart = new Cart({ 
          userId,
          items: [],
          vendorConstraint: {}
        });
      }

      if (operation === 'replace') {
        // Transform frontend items to backend schema
        cart.items = (items || []).map(item => ({
          instrumentId: item.instrumentId || item.id, // Support both id and instrumentId
          name: item.name,
          type: item.type,
          pricePerDay: item.pricePerDay,
          imageUrl: item.imageUrl,
          duration: item.duration || 3,
          vendor: item.vendor ? {
            id: item.vendor.id,
            name: item.vendor.name,
            email: item.vendor.email
          } : undefined,
          addedAt: item.addedAt ? new Date(item.addedAt) : new Date(),
          availabilityExpires: item.availabilityExpires ? 
            new Date(item.availabilityExpires) : 
            new Date(Date.now() + 30 * 60 * 1000) // 30 minutes default
        }));
        
        // Update vendor constraint from first item if exists
        if (cart.items.length > 0 && cart.items[0].vendor) {
          cart.vendorConstraint = {
            currentVendorId: cart.items[0].vendor.id,
            currentVendorName: cart.items[0].vendor.name
          };
        } else {
          cart.vendorConstraint = vendorConstraint || {};
        }
      } else if (operation === 'merge') {
        // Merge logic for guest->logged in transition
        const existingIds = new Set(cart.items.map(item => item.instrumentId.toString()));
        const newItems = (items || []).filter(item => {
          const itemId = item.instrumentId || item.id;
          return !existingIds.has(itemId);
        }).map(item => ({
          instrumentId: item.instrumentId || item.id,
          name: item.name,
          type: item.type,
          pricePerDay: item.pricePerDay,
          imageUrl: item.imageUrl,
          duration: item.duration || 3,
          vendor: item.vendor ? {
            id: item.vendor.id,
            name: item.vendor.name,
            email: item.vendor.email
          } : undefined,
          addedAt: item.addedAt ? new Date(item.addedAt) : new Date(),
          availabilityExpires: item.availabilityExpires ? 
            new Date(item.availabilityExpires) : 
            new Date(Date.now() + 30 * 60 * 1000)
        }));
        
        cart.items = [...cart.items, ...newItems];
        
        // Update vendor constraint if cart was empty
        if (cart.items.length === newItems.length && cart.items[0]?.vendor) {
          cart.vendorConstraint = {
            currentVendorId: cart.items[0].vendor.id,
            currentVendorName: cart.items[0].vendor.name
          };
        }
      }

      cart.lastSyncedAt = new Date();
      await cart.save();

      console.log('Cart synced successfully:', { itemCount: cart.items.length });

      res.json({
        success: true,
        cart: {
          items: cart.items,
          vendorConstraint: cart.vendorConstraint,
          lastSyncedAt: cart.lastSyncedAt
        }
      });
    } catch (error) {
      console.error('Sync cart error:', error);
      res.status(500).json({
        success: false,
        error: error.message,
        details: error.stack
      });
    }
  }

  /**
   * POST /api/cart/:userId/add
   * Add item to cart with optimistic update support
   */
  static async addItem(req, res) {
    try {
      const { userId } = req.params;
      const { instrumentId, duration = 3, vendor } = req.body;

      // Validate instrument exists and is available
      const instrument = await RentalInstrument.findById(instrumentId);
      if (!instrument) {
        return res.status(404).json({
          success: false,
          error: 'Instrument not found'
        });
      }

      let cart = await Cart.findOne({ userId });
      if (!cart) {
        cart = new Cart({ userId, items: [], vendorConstraint: {} });
      }

      // Check if item already exists
      const existingItem = cart.items.find(item => 
        item.instrumentId.toString() === instrumentId
      );

      if (existingItem) {
        return res.status(400).json({
          success: false,
          error: 'Item already in cart'
        });
      }

      // Vendor constraint check
      if (cart.items.length > 0 && vendor) {
        const currentVendor = cart.vendorConstraint.currentVendorId;
        if (currentVendor && currentVendor !== vendor.id) {
          return res.status(400).json({
            success: false,
            error: 'Vendor constraint violation',
            conflictingVendor: cart.vendorConstraint.currentVendorName
          });
        }
      }

      // Add item
      const newItem = {
        instrumentId,
        name: instrument.name,
        type: instrument.type,
        pricePerDay: instrument.pricePerDay,
        imageUrl: instrument.imageUrl,
        duration,
        vendor,
        addedAt: new Date(),
        availabilityExpires: new Date(Date.now() + 30 * 60 * 1000) // 30 minutes
      };

      cart.items.push(newItem);

      // Update vendor constraint
      if (cart.items.length === 1 && vendor) {
        cart.vendorConstraint = {
          currentVendorId: vendor.id,
          currentVendorName: vendor.name
        };
      }

      cart.lastSyncedAt = new Date();
      await cart.save();

      res.json({
        success: true,
        cart: {
          items: cart.items,
          vendorConstraint: cart.vendorConstraint,
          lastSyncedAt: cart.lastSyncedAt
        }
      });
    } catch (error) {
      console.error('Add to cart error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * DELETE /api/cart/:userId/items/:instrumentId
   * Remove item from cart
   */
  static async removeItem(req, res) {
    try {
      const { userId, instrumentId } = req.params;

      const cart = await Cart.findOne({ userId });
      if (!cart) {
        return res.status(404).json({
          success: false,
          error: 'Cart not found'
        });
      }

      const originalLength = cart.items.length;
      cart.items = cart.items.filter(item => 
        item.instrumentId.toString() !== instrumentId
      );

      // Clear vendor constraint if cart is now empty
      if (cart.items.length === 0) {
        cart.vendorConstraint = {};
      }

      // Update vendor constraint if we removed items from current vendor
      if (cart.items.length > 0 && originalLength !== cart.items.length) {
        const firstItem = cart.items[0];
        if (firstItem.vendor) {
          cart.vendorConstraint = {
            currentVendorId: firstItem.vendor.id,
            currentVendorName: firstItem.vendor.name
          };
        }
      }

      cart.lastSyncedAt = new Date();
      await cart.save();

      res.json({
        success: true,
        cart: {
          items: cart.items,
          vendorConstraint: cart.vendorConstraint,
          lastSyncedAt: cart.lastSyncedAt
        }
      });
    } catch (error) {
      console.error('Remove from cart error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * DELETE /api/cart/:userId/clear
   * Clear entire cart
   */
  static async clearCart(req, res) {
    try {
      const { userId } = req.params;

      const cart = await Cart.findOne({ userId });
      if (!cart) {
        return res.status(404).json({
          success: false,
          error: 'Cart not found'
        });
      }

      cart.items = [];
      cart.vendorConstraint = {};
      cart.lastSyncedAt = new Date();
      await cart.save();

      res.json({
        success: true,
        cart: {
          items: [],
          vendorConstraint: {},
          lastSyncedAt: cart.lastSyncedAt
        }
      });
    } catch (error) {
      console.error('Clear cart error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * PUT /api/cart/:userId/items/:instrumentId
   * Update cart item (duration, etc.)
   */
  static async updateItem(req, res) {
    try {
      const { userId, instrumentId } = req.params;
      const updates = req.body;

      const cart = await Cart.findOne({ userId });
      if (!cart) {
        return res.status(404).json({
          success: false,
          error: 'Cart not found'
        });
      }

      const item = cart.items.find(item => 
        item.instrumentId.toString() === instrumentId
      );

      if (!item) {
        return res.status(404).json({
          success: false,
          error: 'Item not found in cart'
        });
      }

      // Update allowed fields
      Object.keys(updates).forEach(key => {
        if (['duration'].includes(key)) {
          item[key] = updates[key];
        }
      });

      cart.lastSyncedAt = new Date();
      await cart.save();

      res.json({
        success: true,
        cart: {
          items: cart.items,
          vendorConstraint: cart.vendorConstraint,
          lastSyncedAt: cart.lastSyncedAt
        }
      });
    } catch (error) {
      console.error('Update cart item error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
}

export default CartController;