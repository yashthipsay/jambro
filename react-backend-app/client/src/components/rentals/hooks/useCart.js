import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth0 } from '@auth0/auth0-react';

const API_BASE_URL = 'http://localhost:5000/api';
const LOCAL_STORAGE_CART_KEY = 'gigsaw_cart';

/**
 * Fetch cart items from backend
 * @param {string} userId - User ID for authenticated users
 * @returns {Promise<Array>} Cart items
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
    throw error;
  }
}

/**
 * Save cart items to localStorage
 * @param {Array} cartItems - Items to save
 */
function saveCartToLocalStorage(cartItems) {
  try {
    localStorage.setItem(LOCAL_STORAGE_CART_KEY, JSON.stringify(cartItems));
    console.log('Cart saved to localStorage:', cartItems.length, 'items');
  } catch (error) {
    console.error('Error saving cart to localStorage:', error);
  }
}

/**
 * Load cart items from localStorage
 * @returns {Array} Cart items from localStorage
 */
function loadCartFromLocalStorage() {
  try {
    const storedCart = localStorage.getItem(LOCAL_STORAGE_CART_KEY);
    return storedCart ? JSON.parse(storedCart) : [];
  } catch (error) {
    console.error('Error loading cart from localStorage:', error);
    return [];
  }
}

/**
 * Sync cart items to backend
 * @param {string} userId - User ID
 * @param {Array} cartItems - Items to sync
 */
async function syncCartToBackend(userId, cartItems) {
  try {
    const response = await fetch(`${API_BASE_URL}/cart`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId,
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

export function useCart() {
  const { isAuthenticated, user } = useAuth0();
  const [cartItems, setCartItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastSynced, setLastSynced] = useState(null);
  
  const isMounted = useRef(true);
  const syncTimeoutRef = useRef(null);

  /**
   * Load cart on component mount and auth state change
   */
  const loadCart = useCallback(async () => {
    if (!isMounted.current) return;
    
    setIsLoading(true);
    setError(null);

    try {
      if (isAuthenticated && user?.email) {
        // For authenticated users, fetch from backend
        console.log('Fetching cart from backend for user:', user.email);
        
        // First, get user ID from email
        const userResponse = await fetch(`${API_BASE_URL}/users`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email: user.email }),
        });

        const userData = await userResponse.json();
        
        if (!userData.success) {
          throw new Error('Failed to get user ID');
        }

        const userId = userData.data._id;
        
        // Fetch cart from backend
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
            
            if (isMounted.current) {
              setCartItems(mergedCart);
              saveCartToLocalStorage(mergedCart);
            }
            
            // Clear the old local-only cart flag
            console.log('Merged', itemsToMerge.length, 'local items with backend cart');
          } else {
            if (isMounted.current) {
              setCartItems(backendCart);
              saveCartToLocalStorage(backendCart);
            }
          }
        } else {
          // No local items, just use backend cart
          if (isMounted.current) {
            setCartItems(backendCart);
            saveCartToLocalStorage(backendCart);
          }
        }
        
        setLastSynced(new Date());
        
      } else {
        // For guest users, load from localStorage only
        console.log('Loading cart from localStorage (guest user)');
        const localCart = loadCartFromLocalStorage();
        
        if (isMounted.current) {
          setCartItems(localCart);
        }
      }
    } catch (err) {
      console.error('Error loading cart:', err);
      
      if (isMounted.current) {
        setError(err.message || 'Failed to load cart');
        
        // Fallback to localStorage on error
        const localCart = loadCartFromLocalStorage();
        setCartItems(localCart);
      }
    } finally {
      if (isMounted.current) {
        setIsLoading(false);
      }
    }
  }, [isAuthenticated, user]);

  /**
   * Add item to cart with optimistic update
   */
  const addItem = useCallback(async (item) => {
    const newItem = {
      ...item,
      id: item.id || item.instrumentId,
      addedAt: new Date().toISOString(),
    };

    // Optimistic update
    const updatedCart = [...cartItems, newItem];
    setCartItems(updatedCart);
    saveCartToLocalStorage(updatedCart);

    // Sync to backend if authenticated
    if (isAuthenticated && user?.email) {
      try {
        const userResponse = await fetch(`${API_BASE_URL}/users`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: user.email }),
        });
        
        const userData = await userResponse.json();
        if (userData.success) {
          await syncCartToBackend(userData.data._id, updatedCart);
        }
      } catch (err) {
        console.error('Failed to sync cart to backend:', err);
        // Keep the optimistic update even if sync fails
      }
    }
  }, [cartItems, isAuthenticated, user]);

  /**
   * Remove item from cart
   */
  const removeItem = useCallback(async (itemId) => {
    const updatedCart = cartItems.filter(item => 
      (item.id || item.instrumentId) !== itemId
    );
    
    setCartItems(updatedCart);
    saveCartToLocalStorage(updatedCart);

    // Sync to backend if authenticated
    if (isAuthenticated && user?.email) {
      try {
        const userResponse = await fetch(`${API_BASE_URL}/users`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: user.email }),
        });
        
        const userData = await userResponse.json();
        if (userData.success) {
          await syncCartToBackend(userData.data._id, updatedCart);
        }
      } catch (err) {
        console.error('Failed to sync cart removal to backend:', err);
      }
    }
  }, [cartItems, isAuthenticated, user]);

  /**
   * Clear cart
   */
  const clearCart = useCallback(async () => {
    setCartItems([]);
    saveCartToLocalStorage([]);

    // Sync to backend if authenticated
    if (isAuthenticated && user?.email) {
      try {
        const userResponse = await fetch(`${API_BASE_URL}/users`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: user.email }),
        });
        
        const userData = await userResponse.json();
        if (userData.success) {
          await syncCartToBackend(userData.data._id, []);
        }
      } catch (err) {
        console.error('Failed to sync cart clear to backend:', err);
      }
    }
  }, [isAuthenticated, user]);

  // Load cart on mount and auth state change
  useEffect(() => {
    isMounted.current = true;
    loadCart();

    return () => {
      isMounted.current = false;
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
      }
    };
  }, [loadCart]);

  return {
    cartItems,
    addItem,
    removeItem,
    clearCart,
    isLoading,
    error,
    lastSynced,
    refetchCart: loadCart,
  };
}