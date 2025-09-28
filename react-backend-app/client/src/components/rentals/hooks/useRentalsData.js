import { useState, useEffect } from 'react';
import { useAuth0 } from '@auth0/auth0-react';

export const useRentalsData = () => {
  const { user } = useAuth0();
  const [instruments, setInstruments] = useState([]);
  const [cartItems, setCartItems] = useState([]);
  const [bookedInstruments, setBookedInstruments] = useState([]);
  const [loading, setLoading] = useState(true);

  // Mock data - replace with actual API calls
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Mock instruments data with vendor information
        setInstruments([
          {
            id: 'guitar-1',
            name: 'Yamaha FG800 Acoustic Guitar',
            type: 'Acoustic Guitar',
            pricePerDay: 500,
            availabilityStatus: 'Available',
            imageUrl: 'https://images.unsplash.com/photo-1510915361894-db8b60106cb1?w=400&h=300&fit=crop',
            vendor: {
              id: 'vendor-1',
              name: 'Music World',
              email: 'contact@musicworld.com'
            }
          },
          {
            id: 'drum-1',
            name: 'Electronic Drum Kit',
            type: 'Electronic Drums',
            pricePerDay: 800,
            availabilityStatus: 'Available',
            imageUrl: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=300&fit=crop',
            vendor: {
              id: 'vendor-1',
              name: 'Music World',
              email: 'contact@musicworld.com'
            }
          },
          {
            id: 'piano-1',
            name: 'Yamaha Digital Piano',
            type: 'Digital Piano',
            pricePerDay: 1200,
            availabilityStatus: 'Available',
            imageUrl: 'https://images.unsplash.com/photo-1520523839897-bd0b52f945a0?w=400&h=300&fit=crop',
            vendor: {
              id: 'vendor-2',
              name: 'Piano Studio',
              email: 'info@pianostudio.com'
            }
          },
          {
            id: 'bass-1',
            name: 'Fender Bass Guitar',
            type: 'Bass Guitar',
            pricePerDay: 600,
            availabilityStatus: 'Unavailable',
            imageUrl: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=300&fit=crop',
            vendor: {
              id: 'vendor-3',
              name: 'Bass Center',
              email: 'bass@center.com'
            }
          }
        ]);

        // Mock booked instruments
        setBookedInstruments([
          {
            id: 'booking-1',
            name: 'Yamaha FG800 Acoustic Guitar',
            bookingId: 'RNT001',
            status: 'in_transit',
            startDate: '2024-01-15',
            endDate: '2024-01-20',
            totalAmount: 2750
          }
        ]);
        
      } catch (error) {
        console.error('Error fetching rental data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleBookInstrument = (instrumentId) => {
    const instrument = instruments.find(inst => inst.id === instrumentId);
    if (!instrument) return;

    // Check if already in cart
    const existingItem = cartItems.find(item => item.id === instrumentId);
    if (existingItem) return;

    // Add to cart with default duration
    const cartItem = {
      ...instrument,
      duration: 3, // Default 3 days
      addedAt: new Date().toISOString()
    };

    setCartItems(prev => [...prev, cartItem]);
  };

  const removeFromCart = (instrumentId) => {
    setCartItems(prev => prev.filter(item => item.id !== instrumentId));
  };

  const updateCartItem = (instrumentId, updates) => {
    setCartItems(prev => 
      prev.map(item => 
        item.id === instrumentId ? { ...item, ...updates } : item
      )
    );
  };

  // Function to create a rental booking
  const createRentalBooking = async (bookingData) => {
    try {
      setLoading(true);
      
      // Mock API call - replace with actual endpoint
      // const response = await fetch('/api/rentals/book', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({
      //     ...bookingData,
      //     userId: user?.sub
      //   })
      // });
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Mock successful booking
      const newBooking = {
        id: `booking-${Date.now()}`,
        bookingId: `RNT${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`,
        name: bookingData.instrumentName,
        type: bookingData.instrumentType,
        status: 'payment_pending',
        startDate: bookingData.startDate,
        endDate: bookingData.endDate,
        totalAmount: bookingData.total,
        customerName: bookingData.name,
        customerPhone: bookingData.phone,
        deliveryAddress: bookingData.address
      };
      
      setBookedInstruments(prev => [...prev, newBooking]);
      
      return { success: true, booking: newBooking };
      
    } catch (error) {
      console.error('Error creating rental booking:', error);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  return {
    instruments,
    cartItems,
    bookedInstruments,
    loading,
    handleBookInstrument,
    removeFromCart,
    updateCartItem,
    createRentalBooking
  };
};