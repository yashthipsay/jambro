import mongoose from 'mongoose';

const cartItemSchema = new mongoose.Schema({
  // instrumentId: {
  //   type: mongoose.Schema.Types.ObjectId,
  //   ref: 'RentalInstrument',
  //   required: true
  // },
  instrumentId: {
    type: String,            // ← Currently only for testing.
    required: true
  },
  name: String,
  type: String,
  pricePerDay: Number,
  imageUrl: String,
  duration: {
    type: Number,
    default: 3
  },
  vendor: {
    id: String,
    name: String,
    email: String
  },
  addedAt: {
    type: Date,
    default: Date.now
  },
  // Availability tracking
  availabilityExpires: Date,
  isReserved: {
    type: Boolean,
    default: false
  }
});

const cartSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  items: [cartItemSchema],
  vendorConstraint: {
    currentVendorId: String,
    currentVendorName: String
  },
  lastSyncedAt: {
    type: Date,
    default: Date.now
  },
  sessionId: String, // For guest cart merging
  expiresAt: {
    type: Date,
    default: () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
  }
}, {
  timestamps: true
});

// Index for automatic cleanup of expired carts
cartSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Pre-save middleware to clean up expired items
cartSchema.pre('save', function(next) {
  const now = new Date();
  this.items = this.items.filter(item => 
    !item.availabilityExpires || item.availabilityExpires > now
  );
  next();
});

export default mongoose.model('Cart', cartSchema);