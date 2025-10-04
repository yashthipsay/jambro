import React, { useState } from "react";
import { useRentalsData } from "./hooks/useRentalsData";
import RentalSubNavigation from "./components/RentalSubNavigation";
import InstrumentsSection from "./sections/InstrumentsSection";
import CartSection from "./sections/CartSection";
import MyRentalsSection from "./sections/MyRentalsSection";
import StatusUpdatesSection from "./sections/StatusUpdatesSection";
import RentalBookingForm from "./components/RentalBookingForm";
import { useVendorConstraint } from "./hooks/useVendorConstraint";
import VendorConflictModal from "./components/VendorConflictModal";
import { toast, Toaster } from "react-hot-toast"; // Add Toaster import

const RentalsContainer = () => {
  const [activeSection, setActiveSection] = useState("instruments");
  const [selectedInstrument, setSelectedInstrument] = useState(null);
  const [showBookingForm, setShowBookingForm] = useState(false);

  const {
    instruments,
    cartItems,
    bookedInstruments,
    loading,
    addToCart,
    removeFromCart,
    updateCartItem,
    updateCart,
    clearCart,
    createRentalBooking,
  } = useRentalsData();

  // Use vendor constraint hook with cart items and update function
  const {
    pendingItem,
    showConflictModal,
    clearAndAdd,
    setShowConflictModal,
    currentVendorName: pendingVendorName
  } = useVendorConstraint(cartItems, updateCart);

const handleSetActiveSection = (section, data = null) => {
  setActiveSection(section);
  if (section === "booking") {
    // Handle both single instrument and cart bookings
    if (data?.cartItems) {
      // Create a combined instrument object for cart bookings
      const cartBooking = {
        id: 'cart-booking',
        name: `Cart (${data.cartItems.length} instruments)`,
        type: 'Multiple Instruments',
        pricePerDay: data.cartItems.reduce((total, item) => total + (item.pricePerDay * (item.duration || 1)), 0),
        items: data.cartItems,
        imageUrl: data.cartItems[0]?.imageUrl
      };
      setSelectedInstrument(cartBooking);
    } else {
      setSelectedInstrument(data);
    }
    setShowBookingForm(true);
  }
};

  const handleBookingComplete = async (bookingData) => {
    try {
      const result = await createRentalBooking(bookingData);
      if (result.success) {
        // Clear cart after successful booking
        clearCart();
        setShowBookingForm(false);
        setActiveSection("my-rentals");
      }
    } catch (error) {
      console.error("Booking failed:", error);
    }
  };

  const handleCalculateDelivery = async (bookingValues) => {
    // Mock calculation - replace with actual API call
    const baseRental =
      (bookingValues.instrumentId
        ? instruments.find((i) => i.id === bookingValues.instrumentId)
            ?.pricePerDay || 500
        : 500) * bookingValues.duration;
    const deliveryFee = 150; // Base delivery fee
    const total = baseRental + deliveryFee;

    return {
      deliveryFee,
      rentalAmount: baseRental,
      total,
    };
  };

  if (loading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center px-4"
        style={{
          backgroundColor: "#f8f6ff",
          backgroundImage:
            "radial-gradient(circle at 50% 0%, #e9e4ff 0%, #f8f6ff 70%)",
        }}
      >
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 sm:h-16 sm:w-16 border-b-2 border-indigo-500 mx-auto mb-4"></div>
          <p className="text-indigo-600 text-base sm:text-lg font-medium">
            Loading instruments...
          </p>
        </div>
      </div>
    );
  }

  const renderActiveSection = () => {
    switch (activeSection) {
      case "instruments":
        return (
          <InstrumentsSection
            instruments={instruments}
            cartItems={cartItems}
            addToCart={addToCart}
            updateCart={updateCart}
          />
        );
      case "cart":
        return (
          <CartSection
            cartItems={cartItems}
            onRemoveFromCart={removeFromCart}
            onUpdateCartItem={updateCartItem}
            onSetActiveSection={handleSetActiveSection}
            onClearCart={clearCart}
          />
        );
      case "my-rentals":
        return (
          <MyRentalsSection
            bookedInstruments={bookedInstruments}
            onSetActiveSection={handleSetActiveSection}
          />
        );
      case "status-updates":
        return <StatusUpdatesSection bookedInstruments={bookedInstruments} />;

      default:
        return null;
    }
  };

return (
  <div
    className="min-h-screen"
    style={{
      backgroundColor: "#f8f6ff",
      backgroundImage: "radial-gradient(circle at 50% 0%, #e9e4ff 70%)",
    }}
  >

      {/* render Toaster once at the root */}
      <Toaster position="bottom-center" />


    {/* Sub Navigation */}
    <RentalSubNavigation
      activeSection={activeSection}
      setActiveSection={handleSetActiveSection}
      instruments={instruments}
      cartItems={cartItems}
      bookedInstruments={bookedInstruments}
    />

    {/* Content - Always render, don't hide when modal is open */}
    <div className="relative">
      {renderActiveSection()}
    </div>

    {/* Booking Form Modal - Render as overlay with semi-transparent backdrop */}
    {showBookingForm && selectedInstrument && (
      <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm">
        <RentalBookingForm
          instrument={selectedInstrument}
          cartItems={cartItems}
          isOpen={showBookingForm}
          onClose={() => {
            setShowBookingForm(false);
            setActiveSection("cart");
          }}
          onCalculate={handleCalculateDelivery}
          onConfirm={handleBookingComplete}
        />
      </div>
    )}
  </div>
);
};

export default RentalsContainer;
