import React, { useMemo } from 'react';
import { useVendorConstraint } from '../hooks/useVendorConstraint';
import { useCartCalculations } from '../hooks/useCartCalculations';
import { toast } from 'react-hot-toast';

const CartSection = ({ cartItems, onRemoveFromCart, onUpdateCartItem, onSetActiveSection, onClearCart }) => {
  // Add vendor constraint hook
  const {
    currentVendorName,
    hasMultipleVendors,
    cartSummary
  } = useVendorConstraint(cartItems);

  // Use cart calculations hook for pricing
  const {
    subtotal,
    deliveryFee,
    deposit,
    total,
    duration,
    breakdown
  } = useCartCalculations(cartItems, {
    // Use earliest start date and latest end date if items have different dates
    // For now, using default 3-day duration, but this could be enhanced
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  });

  const handleProceedToCheckout = () => {
    if (cartItems.length === 0) {
      toast.error('Your cart is empty');
      return;
    }

    // Check if cart has multiple vendors (shouldn't happen, but safety check)
    if (hasMultipleVendors) {
      toast.error('Your cart contains items from multiple vendors. Please clear your cart and try again.');
      return;
    }

    // Create a combined instrument object representing the entire cart
    const cartBooking = {
      id: 'cart-booking',
      name: `Cart (${cartItems.length} instruments)`,
      type: `${cartItems.length} musical instruments`,
      pricePerDay: subtotal, // Use calculated subtotal
      items: cartItems,
      imageUrl: cartItems[0]?.imageUrl || '/placeholder.svg',
      vendor: cartItems[0]?.vendor // Ensure vendor info is passed
    };
    
    // Pass the combined instrument to booking section
    onSetActiveSection('booking', cartBooking);
  };

  // Vendor warning banner for multiple vendors (should not happen if constraints are working)
  const VendorWarningBanner = useMemo(() => {
    if (!hasMultipleVendors) return null;
    
    return (
      <div className="bg-red-100 border border-red-300 rounded-lg p-3 mb-4">
        <p className="text-sm text-red-700 font-medium">
          Warning: Your cart contains items from multiple vendors
        </p>
        <p className="text-xs text-red-600 mt-1">
          This may cause issues during checkout. Please consider clearing your cart.
        </p>
      </div>
    );
  }, [hasMultipleVendors]);

  return (
    <div 
      className="px-4 py-8 pb-32 md:pb-8"
      style={{
        minHeight: "calc(100vh - 4rem)"
      }}
    >
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl sm:text-3xl font-bold text-indigo-700">Your Cart</h2>
          {cartItems.length > 0 && (
            <button 
              onClick={onClearCart}
              className="text-red-600 hover:text-red-700 text-sm font-medium"
            >
              Clear Cart
            </button>
          )}
        </div>
        
        {/* Add vendor warning if multiple vendors detected */}
        {VendorWarningBanner}
        
        {cartItems.length > 0 ? (
          <div className="space-y-4">
            {/* Vendor Info */}
            <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-3">
              <p className="text-sm text-indigo-700">
                <span className="font-medium">Vendor:</span> {currentVendorName || 'Unknown Vendor'}
              </p>
              <p className="text-xs text-indigo-600 mt-1">
                All items in your cart are from the same vendor
              </p>
            </div>

            {/* Cart Items */}
            {cartItems.map((item) => (
              <div key={item.id} className="bg-white/80 backdrop-blur-sm rounded-xl border border-indigo-100 p-4 shadow-sm">
                <div className="flex items-center gap-4">
                  <img 
                    src={item.imageUrl || '/placeholder.svg'} 
                    alt={item.name}
                    className="w-16 h-16 rounded-lg object-cover border border-indigo-100"
                  />
                  <div className="flex-1">
                    <h3 className="text-gray-800 font-semibold">{item.name}</h3>
                    <p className="text-gray-600 text-sm">{item.type}</p>
                    <p className="text-indigo-600 font-bold">₹{item.pricePerDay}/day</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <select
                      value={item.duration}
                      onChange={(e) => onUpdateCartItem(item.id, { duration: parseInt(e.target.value) })}
                      className="px-2 py-1 bg-white border border-indigo-200 rounded text-gray-800 text-sm focus:outline-none focus:border-indigo-400"
                    >
                      {[1,2,3,4,5,6,7].map(days => (
                        <option key={days} value={days}>{days} day{days > 1 ? 's' : ''}</option>
                      ))}
                    </select>
                    <button
                      onClick={() => onRemoveFromCart(item.id)}
                      className="p-2 text-red-500 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t border-indigo-100 flex justify-between items-center">
                  <span className="text-gray-600">Subtotal:</span>
                  <span className="text-indigo-600 font-bold">₹{item.pricePerDay * item.duration}</span>
                </div>
              </div>
            ))}

            {/* Enhanced Pricing Summary */}
            <div className="bg-gradient-to-r from-indigo-50 to-purple-50 backdrop-blur-sm rounded-xl border border-indigo-200 p-4 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-800 mb-3">Price Summary</h3>
              
              {/* Price Breakdown */}
              <div className="space-y-2 mb-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Rental Amount</span>
                  <span className="text-gray-800">₹{subtotal}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Delivery Fee</span>
                  <span className="text-gray-800">₹{deliveryFee}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Security Deposit (20%)</span>
                  <span className="text-gray-800">₹{deposit}</span>
                </div>
                <div className="border-t border-indigo-200 pt-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xl font-bold text-gray-800">Total Amount</span>
                    <span className="text-2xl font-bold text-indigo-600">₹{total}</span>
                  </div>
                </div>
              </div>

              {/* Additional Info */}
              <div className="text-xs text-gray-600 mb-4 space-y-1">
                <p>• Duration: {duration} day{duration > 1 ? 's' : ''}</p>
                <p>• Security deposit will be refunded after return</p>
                <p>• Free delivery within city limits</p>
              </div>

              <button 
                onClick={handleProceedToCheckout}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-300 transform hover:scale-[1.02] shadow-md hover:shadow-lg"
                disabled={hasMultipleVendors}
              >
                Proceed to Checkout
              </button>
              {hasMultipleVendors && (
                <p className="text-xs text-red-500 text-center mt-2">
                  Please clear cart and select items from a single vendor
                </p>
              )}
            </div>

            {/* Detailed Breakdown (Optional - can be collapsed) */}
            {breakdown && breakdown.length > 0 && (
              <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-indigo-100 p-4 shadow-sm">
                <h4 className="text-sm font-semibold text-gray-700 mb-3">Item Breakdown</h4>
                <div className="space-y-2">
                  {breakdown.map(item => (
                    <div key={item.id} className="flex justify-between items-center text-sm">
                      <span className="text-gray-600">
                        {item.name} × {item.duration} day{item.duration > 1 ? 's' : ''}
                      </span>
                      <span className="font-medium text-gray-800">₹{item.total}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">🛒</div>
            <h3 className="text-2xl font-bold text-indigo-600 mb-2">Your cart is empty</h3>
            <p className="text-gray-600 mb-6">Add some instruments to get started</p>
            <button 
              onClick={() => onSetActiveSection('instruments')}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-8 rounded-lg transition-all duration-300 transform hover:scale-105 shadow-md hover:shadow-lg"
            >
              Browse Instruments
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default CartSection;