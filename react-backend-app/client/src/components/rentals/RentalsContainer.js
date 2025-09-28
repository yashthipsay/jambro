import React, { useState } from 'react';
import { useRentalsData } from './hooks/useRentalsData';
import RentalSubNavigation from './components/RentalSubNavigation';
import InstrumentsSection from './sections/InstrumentsSection';
import CartSection from './sections/CartSection';
import MyRentalsSection from './sections/MyRentalsSection';
import StatusUpdatesSection from './sections/StatusUpdatesSection';
import RentalBookingForm from './components/RentalBookingForm';

const RentalsContainer = () => {
  const [activeSection, setActiveSection] = useState('instruments');
  const [selectedInstrument, setSelectedInstrument] = useState(null);
  const [showBookingForm, setShowBookingForm] = useState(false);
  
  const {
    instruments,
    cartItems,
    bookedInstruments,
    loading,
    handleBookInstrument,
    removeFromCart,
    updateCartItem,
    // Expose this for vendor constraint
    createRentalBooking
  } = useRentalsData();

  // Helper function to update the entire cart (for vendor constraint)
  const updateCart = (newCart) => {
    // First remove all items from cart
    cartItems.forEach(item => removeFromCart(item.id));
    
    // Then add all items from the new cart
    newCart.forEach(item => {
      // Since we're replacing the whole cart, we don't need vendor constraint here
      // We can use the direct add function from useRentalsData
      handleBookInstrument(item.id);
    });
  };

  const handleSetActiveSection = (section, instrument = null) => {
    setActiveSection(section);
    if (section === 'booking' && instrument) {
      setSelectedInstrument(instrument);
      setShowBookingForm(true);
    }
  };

  const handleBookingComplete = async (bookingData) => {
    try {
      await handleBookInstrument(bookingData);
      setShowBookingForm(false);
      setActiveSection('my-rentals');
    } catch (error) {
      console.error('Booking failed:', error);
    }
  };

  if (loading) {
    return (
      <div 
        className="min-h-screen flex items-center justify-center px-4"
        style={{
          backgroundColor: "#f8f6ff",
          backgroundImage: "radial-gradient(circle at 50% 0%, #e9e4ff 0%, #f8f6ff 70%)",
        }}
      >
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 sm:h-16 sm:w-16 border-b-2 border-indigo-500 mx-auto mb-4"></div>
          <p className="text-indigo-600 text-base sm:text-lg font-medium">Loading instruments...</p>
        </div>
      </div>
    );
  }

  const renderActiveSection = () => {
    switch (activeSection) {
      case 'instruments':
        return (
          <InstrumentsSection
            instruments={instruments}
            cartItems={cartItems}
            onBookInstrument={handleBookInstrument}
            // Add this prop for vendor constraint
            updateCart={updateCart}
          />
        );
      case 'cart':
        return (
          <CartSection
            cartItems={cartItems}
            onRemoveFromCart={removeFromCart}
            onUpdateCartItem={updateCartItem}
            onSetActiveSection={handleSetActiveSection}
          />
        );
      case 'my-rentals':
        return (
          <MyRentalsSection
            bookedInstruments={bookedInstruments}
            onSetActiveSection={handleSetActiveSection}
          />
        );
      case 'status-updates':
        return (
          <StatusUpdatesSection
            bookedInstruments={bookedInstruments}
          />
        );
      
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen" style={{
      backgroundColor: "#f8f6ff",
      backgroundImage: "radial-gradient(circle at 50% 0%, #e9e4ff 0%, #f8f6ff 70%)",
    }}>
      {/* Sub Navigation */}
      <RentalSubNavigation
        activeSection={activeSection}
        setActiveSection={handleSetActiveSection}
        instruments={instruments}
        cartItems={cartItems}
        bookedInstruments={bookedInstruments}
      />

      {/* Content */}
      <div className="relative">
        {renderActiveSection()}
      </div>

      {/* Booking Form Modal */}
      {showBookingForm && selectedInstrument && (
        <RentalBookingForm
          instrument={selectedInstrument}
          isOpen={showBookingForm}
          onClose={() => {
            setShowBookingForm(false);
            setActiveSection('cart');
          }}
          onConfirm={handleBookingComplete}
        />
      )}
    </div>
  );
};

export default RentalsContainer;