import { useState, useEffect } from "react";
import { useAuth0 } from "@auth0/auth0-react";

const API_BASE_URL = 'http://localhost:5001/api';
const LOCAL_STORAGE_CART_KEY = 'gigsaw_cart';
const LOCAL_STORAGE_CART_TTL = 7 * 24 * 60 * 60 * 1000; // 7 days

/**
 * Fetch cart items from backend
 */
async function fetchCartFromBackend(userId) {
  try {
    const response = await fetch(`${API_BASE_URL}/cart/${userId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    
    if (data.success) {
      return data.data || [];
    }
    
    throw new Error(data.message || 'Failed to fetch cart');
  } catch (error) {
    console.error('Error fetching cart from backend:', error);
    return [];
  }
}

/**
 * Save cart items to localStorage
 */
function saveCartToLocalStorage(cartItems) {
  try {
    const record = {
      value: cartItems,
      timestamp: Date.now()
    };
    localStorage.setItem(LOCAL_STORAGE_CART_KEY, JSON.stringify(record));
    console.log('Cart saved to localStorage:', cartItems.length, 'items');
  } catch (error) {
    console.error('Error saving cart to localStorage:', error);
  }
}

/**
 * Load cart items from localStorage
 */
function loadCartFromLocalStorage() {
  try {
    const record = JSON.parse(localStorage.getItem(LOCAL_STORAGE_CART_KEY));
    if (!record) return [];
    // if expired, clear and return empty
    if (Date.now() - record.timestamp > LOCAL_STORAGE_CART_TTL) {
      localStorage.removeItem(LOCAL_STORAGE_CART_KEY);
      console.log('LocalStorage cart expired, cleared');
      return [];
    }
    return record.value || [];
  } catch (error) {
    console.error('Error loading cart from localStorage:', error);
    return [];
  }
}

/**
 * Sync cart items to backend
 */
async function syncCartToBackend(userId, cartItems) {
  try {
    console.log("[debug] Syncing cart to backend for user:", userId, "with", cartItems, "items");
    const response = await fetch(`${API_BASE_URL}/cart/${userId}/sync`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        items: cartItems,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data.success;
  } catch (error) {
    console.error('Error syncing cart to backend:', error);
    return false;
  }
}

/**
 * Get user ID from email
 */
async function getUserId(email) {
  try {
    const userResponse = await fetch(`https://api.vision.gigsaw.co.in/api/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email }),
    });

    const userData = await userResponse.json();
    
    if (userData.success) {
      return userData.data._id;
    }
    
    throw new Error('Failed to get user ID');
  } catch (error) {
    console.error('Error getting user ID:', error);
    return null;
  }
}

export const useRentalsData = () => {
  const { user, isAuthenticated } = useAuth0();
  const [instruments, setInstruments] = useState([]);
  const [cartItems, setCartItems] = useState([]);
  const [bookedInstruments, setBookedInstruments] = useState([]);
  const [loading, setLoading] = useState(true);

  // Load cart on mount and auth state change
  useEffect(() => {
    const loadCart = async () => {
      try {
        if (isAuthenticated && user?.email) {
          // For authenticated users, fetch from backend
          console.log('Fetching cart from backend for user:', user.email);
          
          const userId = await getUserId(user.email);
          if (userId) {
            const backendCart = await fetchCartFromBackend(userId);
            
            // Check if we have local cart items to merge
            const localCart = loadCartFromLocalStorage();
            
            if (localCart.length > 0) {
              console.log('Merging local cart with backend cart');
              
              // Merge logic: Add local items not present in backend
              const backendIds = new Set(backendCart.map(item => item.instrumentId || item.id));
              const itemsToMerge = localCart.filter(item => 
                !backendIds.has(item.instrumentId || item.id)
              );
              
              if (itemsToMerge.length > 0) {
                // Sync merged items to backend
                const mergedCart = [...backendCart, ...itemsToMerge];
                await syncCartToBackend(userId, mergedCart);
                setCartItems(mergedCart);
                saveCartToLocalStorage(mergedCart);
                console.log('Merged', itemsToMerge.length, 'local items with backend cart');
              } else {
                setCartItems(backendCart);
                saveCartToLocalStorage(backendCart);
              }
            } else {
              // No local items, just use backend cart
              setCartItems(backendCart);
              saveCartToLocalStorage(backendCart);
            }
          }
        } else {
          // For guest users, load from localStorage only
          console.log('Loading cart from localStorage (guest user)');
          const localCart = loadCartFromLocalStorage();
          setCartItems(localCart);
        }
      } catch (error) {
        console.error('Error loading cart:', error);
        // Fallback to localStorage on error
        const localCart = loadCartFromLocalStorage();
        setCartItems(localCart);
      }
    };

    loadCart();
  }, [isAuthenticated, user?.email]);

  // Mock data - replace with actual API calls
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Simulate API call
        await new Promise((resolve) => setTimeout(resolve, 1000));

        // Mock instruments data with vendor information
        setInstruments([
          {
            id: "guitar-1",
            name: "Yamaha FG800 Acoustic Guitar",
            type: "Acoustic Guitar",
            pricePerDay: 500,
            availabilityStatus: "Available",
            imageUrl:
              "https://images.unsplash.com/photo-1510915361894-db8b60106cb1?w=400&h=300&fit=crop",
            vendor: {
              id: "vendor-1",
              name: "Music World",
              email: "contact@musicworld.com",
            },
          },
          {
            id: "drum-1",
            name: "Electronic Drum Kit",
            type: "Electronic Drums",
            pricePerDay: 800,
            availabilityStatus: "Available",
            imageUrl:
              "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=300&fit=crop",
            vendor: {
              id: "vendor-1",
              name: "Music World",
              email: "contact@musicworld.com",
            },
          },
          {
            id: "piano-1",
            name: "Yamaha Digital Piano",
            type: "Digital Piano",
            pricePerDay: 1200,
            availabilityStatus: "Available",
            imageUrl:
              "https://images.unsplash.com/photo-1520523839897-bd0b52f945a0?w=400&h=300&fit=crop",
            vendor: {
              id: "vendor-2",
              name: "Piano Studio",
              email: "info@pianostudio.com",
            },
          },
          {
            id: "bass-1",
            name: "Fender Bass Guitar",
            type: "Bass Guitar",
            pricePerDay: 600,
            availabilityStatus: "Available",
            imageUrl:
              "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=300&fit=crop",
            vendor: {
              id: "vendor-3",
              name: "Bass Center",
              email: "bass@center.com",
            },
          },
          {
            id: "keyboard-1",
            name: "Roland Synthesizer",
            type: "Synthesizer",
            pricePerDay: 900,
            availabilityStatus: "Available",
            imageUrl:
              "https://images.unsplash.com/photo-1571327073757-71d13c24de30?w=400&h=300&fit=crop",
            vendor: {
              id: "vendor-2",
              name: "Piano Studio",
              email: "info@pianostudio.com",
            },
          },
        ]);

        // Mock booked instruments
        setBookedInstruments([
          {
            id: "booking-1",
            name: "Yamaha FG800 Acoustic Guitar",
            bookingId: "RNT001",
            status: "in_transit",
            startDate: "2024-01-15",
            endDate: "2024-01-20",
            totalAmount: 2750,
          },
        ]);
      } catch (error) {
        console.error("Error fetching rental data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Add item to cart with backend sync
  const addToCart = async (instrumentId, duration = 3) => {
    const instrument = instruments.find((inst) => inst.id === instrumentId);
    if (!instrument) {
      console.error("Instrument not found:", instrumentId);
      return false;
    }

    // Check if already in cart
    const existingItem = cartItems.find((item) => item.id === instrumentId);
    if (existingItem) {
      console.log("Item already in cart:", instrumentId);
      return false;
    }

    // Check vendor constraint
    if (cartItems.length > 0) {
      const currentVendor = cartItems[0].vendor;
      if (
        currentVendor &&
        instrument.vendor &&
        currentVendor.id !== instrument.vendor.id &&
        currentVendor.email !== instrument.vendor.email
      ) {
        console.error("Vendor constraint violation");
        return false;
      }
    }

    // Add to cart with duration
    const cartItem = {
      ...instrument,
      duration,
      addedAt: new Date().toISOString(),
    };

    // Optimistic update
    const updatedCart = [...cartItems, cartItem];
    setCartItems(updatedCart);
    saveCartToLocalStorage(updatedCart);

    // Sync to backend if authenticated
    if (isAuthenticated && user?.email) {
      try {
        const userId = await getUserId(user.email);
        if (userId) {
          await syncCartToBackend(userId, updatedCart);
        }
      } catch (err) {
        console.error('Failed to sync cart to backend:', err);
        // Keep the optimistic update even if sync fails
      }
    }

    return true;
  };

  // Remove item from cart with backend sync
  const removeFromCart = async (instrumentId) => {
    const updatedCart = cartItems.filter((item) => item.id !== instrumentId);
    
    // Optimistic update
    setCartItems(updatedCart);
    saveCartToLocalStorage(updatedCart);

    // Sync to backend if authenticated
    if (isAuthenticated && user?.email) {
      try {
        const userId = await getUserId(user.email);
        if (userId) {
          await syncCartToBackend(userId, updatedCart);
        }
      } catch (err) {
        console.error('Failed to sync cart removal to backend:', err);
      }
    }
  };

  // Update cart item (e.g., duration) with backend sync
  const updateCartItem = async (instrumentId, updates) => {
    const updatedCart = cartItems.map((item) =>
      item.id === instrumentId ? { ...item, ...updates } : item
    );
    
    // Optimistic update
    setCartItems(updatedCart);
    saveCartToLocalStorage(updatedCart);

    // Sync to backend if authenticated
    if (isAuthenticated && user?.email) {
      try {
        const userId = await getUserId(user.email);
        if (userId) {
          await syncCartToBackend(userId, updatedCart);
        }
      } catch (err) {
        console.error('Failed to sync cart update to backend:', err);
      }
    }
  };

  // Replace entire cart (used by vendor constraint) with backend sync
  const updateCart = async (newCartItems) => {
    // Optimistic update
    setCartItems(newCartItems);
    saveCartToLocalStorage(newCartItems);

    // Sync to backend if authenticated
    if (isAuthenticated && user?.email) {
      try {
        const userId = await getUserId(user.email);
        if (userId) {
          await syncCartToBackend(userId, newCartItems);
        }
      } catch (err) {
        console.error('Failed to sync cart to backend:', err);
      }
    }
  };

  // Clear entire cart with backend sync
  const clearCart = async () => {
    // Optimistic update
    setCartItems([]);
    saveCartToLocalStorage([]);

    // Sync to backend if authenticated
    if (isAuthenticated && user?.email) {
      try {
        const userId = await getUserId(user.email);
        if (userId) {
          await syncCartToBackend(userId, []);
        }
      } catch (err) {
        console.error('Failed to sync cart clear to backend:', err);
      }
    }
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
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Mock successful booking
      const newBooking = {
        id: `booking-${Date.now()}`,
        bookingId: `RNT${String(Math.floor(Math.random() * 1000)).padStart(
          3,
          "0"
        )}`,
        name: bookingData.instrumentName,
        type: bookingData.instrumentType,
        status: "payment_pending",
        startDate: bookingData.startDate,
        endDate: bookingData.endDate,
        totalAmount: bookingData.total,
        customerName: bookingData.name,
        customerPhone: bookingData.phone,
        deliveryAddress: bookingData.address,
      };

      setBookedInstruments((prev) => [...prev, newBooking]);

      return { success: true, booking: newBooking };
    } catch (error) {
      console.error("Error creating rental booking:", error);
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
    addToCart,
    removeFromCart,
    updateCartItem,
    updateCart,
    clearCart,
    createRentalBooking,
  };
};