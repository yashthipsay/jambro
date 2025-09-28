import React from 'react';
import { ShoppingCart, Package, Bell, Grid3x3 } from 'lucide-react';

const RentalSubNavigation = ({ 
  activeSection, 
  setActiveSection, 
  instruments, 
  cartItems, 
  bookedInstruments 
}) => {
  const subNavItems = [
    {
      id: 'instruments',
      label: 'Instruments',
      icon: <Grid3x3 className="w-4 h-4" />,
      count: instruments.length
    },
    {
      id: 'cart',
      label: 'Cart',
      icon: <ShoppingCart className="w-4 h-4" />,
      count: cartItems.length
    },
    {
      id: 'my-rentals',
      label: 'My Rentals',
      icon: <Package className="w-4 h-4" />,
      count: bookedInstruments.length
    },
    ...(bookedInstruments.length > 0 ? [{
      id: 'status-updates',
      label: 'Status Updates',
      icon: <Bell className="w-4 h-4" />,
      count: bookedInstruments.filter(item => !['delivered', 'COMPLETED'].includes(item.status)).length
    }] : [])
  ];

  return (
    <div className="fixed bottom-14 left-0 right-0 z-30 bg-white/95 backdrop-blur-md border-t border-indigo-200/50 shadow-lg">
      <div className="max-w-7xl mx-auto px-2 sm:px-4">
        <div className="flex items-center justify-center overflow-x-auto scrollbar-hide py-2 gap-1 sm:gap-2">
          {subNavItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveSection(item.id)}
              className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 rounded-full whitespace-nowrap transition-all duration-300 text-xs sm:text-sm ${
                activeSection === item.id
                  ? 'bg-indigo-600 text-white shadow-lg'
                  : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100 hover:text-indigo-800'
              }`}
            >
              {item.icon}
              <span className="font-medium hidden sm:inline">{item.label}</span>
              <span className="font-medium sm:hidden">{item.label.split(' ')[0]}</span>
              {item.count > 0 && (
                <span className={`ml-1 px-1.5 sm:px-2 py-0.5 text-xs rounded-full ${
                  activeSection === item.id 
                    ? 'bg-white/20 text-white' 
                    : 'bg-indigo-200 text-indigo-800'
                }`}>
                  {item.count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default RentalSubNavigation;