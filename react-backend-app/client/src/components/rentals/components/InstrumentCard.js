import React, { useState } from 'react';
import RentalBookingForm from './RentalBookingForm';
import { useVendorConstraint } from '../hooks/useVendorConstraint';
import VendorConflictModal from './VendorConflictModal';

const InstrumentCard = ({
  imageUrl,
  name,
  type,
  pricePerDay,
  availabilityStatus,
  onBook,
  isInCart = false,
  className = '',
  // Add these new props for vendor constraint
  cartItems = [],
  updateCart,
  vendor, // vendor/owner info for this instrument
  ...rest
}) => {
  const [showBookingForm, setShowBookingForm] = useState(false);
  const isAvailable = availabilityStatus === 'Available';

  // Initialize vendor constraint hook
  const {
    addWithConstraintCheck,
    showConflictModal,
    setShowConflictModal,
    pendingItem,
    conflictingItems,
    currentVendorName,
    getVendorName,
    clearAndAdd,
    clearPendingConflict,
    canAdd
  } = useVendorConstraint(cartItems, updateCart);

  const handleDirectBooking = () => {
    setShowBookingForm(true);
  };

  const handleCalculateDelivery = async (bookingValues) => {
    // Mock calculation - replace with actual API call
    const baseRental = pricePerDay * bookingValues.duration;
    const deliveryFee = 150; // Base delivery fee
    const total = baseRental + deliveryFee;
    
    return {
      deliveryFee,
      rentalAmount: baseRental,
      total
    };
  };

  const handleConfirmBooking = async (bookingValues) => {
    // Handle the booking confirmation
    console.log('Booking confirmed:', bookingValues);
    // You would typically make an API call here
    // await createRentalBooking(bookingValues);
    
    // Show success message
    alert('Booking confirmed! We will contact you soon.');
  };

  // Enhanced add to cart with vendor constraint checking
  const handleAddToCart = () => {
    if (!isAvailable || isInCart) return;

    // Create instrument item with vendor info
    const instrumentItem = {
      id: rest.id || name,
      name,
      type,
      pricePerDay,
      imageUrl,
      vendor, // Include vendor info
      // Add other relevant fields
    };

    // Use constraint-aware add function
    const success = addWithConstraintCheck(instrumentItem, onBook);
    
    if (success && !showConflictModal) {
      // Item was successfully added without conflicts
      console.log('Item added to cart successfully');
    }
  };

  // Check if this item can be added to current cart
  const canAddToCart = canAdd({
    id: rest.id || name,
    name,
    type,
    vendor
  });

  // Get vendor name for conflict modal
  const newVendorName = pendingItem ? 
    getVendorName(pendingItem.vendor) : 
    '';

  return (
    <>
      <div
        className={`group w-full overflow-hidden rounded-xl bg-white/80 backdrop-blur-sm border border-indigo-100 shadow-sm transition-all duration-300 hover:shadow-lg hover:shadow-indigo-200/30 hover:border-indigo-200 ${className}`}
        {...rest}
      >
        {/* Mobile-Optimized Image Container */}
        <div className="relative overflow-hidden bg-gray-50">
          <div className="aspect-[4/3] sm:aspect-[16/9]">
            <img
              src={imageUrl || '/placeholder.svg'}
              alt={`${name} - ${type}`}
              className="h-full w-full object-cover transition-transform duration-300 sm:duration-500 ease-out group-hover:scale-105 sm:group-hover:scale-110"
              loading="lazy"
            />
          </div>

          {/* Mobile-Friendly Availability Badge */}
          <div
            className={`absolute right-2 top-2 sm:right-3 sm:top-3 rounded-full px-2 py-1 sm:px-3 sm:py-1.5 text-xs font-semibold backdrop-blur-sm border ${
              isAvailable
                ? 'bg-green-500/90 text-white border-green-400/50'
                : 'bg-red-500/90 text-white border-red-400/50'
            }`}
            aria-label={`Status: ${availabilityStatus}`}
          >
            {availabilityStatus}
          </div>

          {/* Cart Status Indicator */}
          {isInCart && (
            <div className="absolute left-2 top-2 sm:left-3 sm:top-3 rounded-full px-2 py-1 sm:px-3 sm:py-1.5 text-xs font-semibold backdrop-blur-sm border bg-indigo-500/90 text-white border-indigo-400/50">
              In Cart
            </div>
          )}

          {/* Vendor Conflict Warning */}
          {cartItems.length > 0 && !canAddToCart && !isInCart && (
            <div className="absolute left-2 bottom-2 sm:left-3 sm:bottom-3 rounded-full px-2 py-1 sm:px-3 sm:py-1.5 text-xs font-semibold backdrop-blur-sm border bg-orange-500/90 text-white border-orange-400/50">
              Different Vendor
            </div>
          )}

          {/* Subtle overlay for mobile */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        </div>

        {/* Mobile-First Details Section */}
        <div className="p-3 sm:p-4 md:p-5 space-y-2 sm:space-y-3">
          <div>
            <h3 className="text-base sm:text-lg font-bold text-gray-800 group-hover:text-indigo-600 transition-colors duration-300 leading-tight">
              {name}
            </h3>
            <p className="text-xs sm:text-sm text-gray-600 font-medium">{type}</p>
            
            {/* Vendor Name */}
            {vendor && (
              <p className="text-xs text-gray-500 mt-1">
                by {getVendorName(vendor)}
              </p>
            )}
          </div>

          {/* Mobile-Optimized Price Display */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-lg sm:text-xl font-bold text-indigo-600">
                ₹{pricePerDay.toLocaleString()}
              </p>
              <p className="text-xs sm:text-sm text-gray-500 font-normal -mt-1">
                per day
              </p>
            </div>
            {/* Mobile indicator for availability */}
            <div className={`w-2 h-2 rounded-full ${isAvailable ? 'bg-green-400' : 'bg-red-400'} sm:hidden`} />
          </div>

          {/* Vendor Conflict Warning Text */}
          {cartItems.length > 0 && !canAddToCart && !isInCart && (
            <div className="text-xs text-orange-600 bg-orange-50 px-2 py-1 rounded">
              Can't mix vendors. Current cart: {currentVendorName}
            </div>
          )}
        </div>

        {/* Mobile-First Action Buttons */}
        <div className="p-3 sm:p-4 md:p-5 pt-0 space-y-2">
          <button
            type="button"
            onClick={handleAddToCart}
            disabled={!isAvailable || isInCart}
            className={`w-full py-2.5 sm:py-3 px-4 rounded-lg text-sm font-semibold transition-all duration-300 touch-manipulation ${
              isInCart
                ? 'bg-indigo-100 text-indigo-600 cursor-default border border-indigo-200'
                : isAvailable
                  ? 'bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white shadow-md hover:shadow-lg hover:shadow-indigo-200/50 transform active:scale-95 sm:hover:scale-[1.02] sm:active:scale-[0.98]'
                  : 'bg-gray-200 text-gray-500 cursor-not-allowed border border-gray-300'
            }`}
          >
            {isInCart ? 'Added to Cart' : isAvailable ? 'Add to Cart' : 'Unavailable'}
          </button>

          {/* Direct Booking Button */}
          {isAvailable && !isInCart && (
            <button
              type="button"
              onClick={handleDirectBooking}
              className="w-full py-2.5 sm:py-3 px-4 rounded-lg text-sm font-semibold transition-all duration-300 touch-manipulation bg-white text-indigo-600 border border-indigo-200 hover:bg-indigo-50 hover:border-indigo-300 transform active:scale-95 sm:hover:scale-[1.02] sm:active:scale-[0.98]"
            >
              Book Now
            </button>
          )}
        </div>
      </div>

      {/* Booking Form Modal */}
      <RentalBookingForm
        isOpen={showBookingForm}
        onClose={() => setShowBookingForm(false)}
        instrument={{
          id: rest.id || name,
          name,
          type,
          pricePerDay,
          imageUrl
        }}
        onCalculate={handleCalculateDelivery}
        onConfirm={handleConfirmBooking}
      />

      {/* Vendor Conflict Resolution Modal */}
      <VendorConflictModal
        isOpen={showConflictModal}
        onClose={() => setShowConflictModal(false)}
        pendingItem={pendingItem}
        conflictingItems={conflictingItems}
        currentVendorName={currentVendorName}
        newVendorName={newVendorName}
        onClearAndAdd={clearAndAdd}
        onCancel={clearPendingConflict}
      />
    </>
  );
};

export default InstrumentCard;