import React from 'react';

const CartSection = ({ cartItems, onRemoveFromCart, onUpdateCartItem, onSetActiveSection }) => {
  const handleProceedToCheckout = () => {
    if (cartItems.length > 0) {
      // Pass the first cart item as the selected instrument for booking
      const firstItem = cartItems[0];
      onSetActiveSection('booking', firstItem);
    }
  };

  return (
    <div 
      className="px-4 py-8 pb-32 md:pb-8"
      style={{
        minHeight: "calc(100vh - 4rem)"
      }}
    >
      <div className="max-w-4xl mx-auto">
        <h2 className="text-2xl sm:text-3xl font-bold text-indigo-700 mb-6">Your Cart</h2>
        
        {cartItems.length > 0 ? (
          <div className="space-y-4">
            {cartItems.map((item) => (
              <div key={item.id} className="bg-white/80 backdrop-blur-sm rounded-xl border border-indigo-100 p-4 shadow-sm">
                <div className="flex items-center gap-4">
                  <img 
                    src={item.imageUrl} 
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
            
            <div className="bg-gradient-to-r from-indigo-50 to-purple-50 backdrop-blur-sm rounded-xl border border-indigo-200 p-4 shadow-sm">
              <div className="flex justify-between items-center mb-4">
                <span className="text-xl font-bold text-gray-800">Total:</span>
                <span className="text-2xl font-bold text-indigo-600">
                  ₹{cartItems.reduce((total, item) => total + (item.pricePerDay * item.duration), 0)}
                </span>
              </div>
              <button 
                onClick={handleProceedToCheckout}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-300 transform hover:scale-[1.02] shadow-md hover:shadow-lg"
              >
                Proceed to Checkout
              </button>
            </div>
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