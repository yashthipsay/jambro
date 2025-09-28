import { useState, useCallback, useMemo } from 'react';
import { toast } from 'react-hot-toast'; // or your preferred toast library

/**
 * Enhanced hook to manage vendor constraints for rental cart
 * Ensures all items in cart are from the same vendor with toast notifications
 * @param {Array} cartItems - Current items in the cart
 * @param {Function} updateCart - Function to update cart state
 * @returns {Object} - Vendor constraint utilities with toast integration
 */
export const useVendorConstraint = (cartItems = [], updateCart = null) => {
  const [pendingItem, setPendingItem] = useState(null);
  const [showConflictModal, setShowConflictModal] = useState(false);

  // Get the current vendor from cart items (first item sets the vendor)
  const currentVendor = useMemo(() => {
    if (cartItems.length === 0) return null;
    
    // Handle different vendor property structures from your workspace
    const firstItem = cartItems[0];
    return firstItem?.vendor || 
           firstItem?.jamRoom || 
           firstItem?.ownerDetails || 
           firstItem?.instrument?.vendor ||
           null;
  }, [cartItems]);

  // Get vendor display name (handles different name structures from your codebase)
  const getVendorName = useCallback((vendor) => {
    if (!vendor) return 'Unknown Vendor';
    
    // Handle different naming patterns from your workspace
    return vendor.name || 
           vendor.jamRoomDetails?.name || 
           vendor.ownerDetails?.name ||
           vendor.jamRoomName ||
           vendor.businessName ||
           'Unknown Vendor';
  }, []);

  // Get current vendor display name
  const currentVendorName = useMemo(() => {
    return currentVendor ? getVendorName(currentVendor) : null;
  }, [currentVendor, getVendorName]);

  // Check if a new item can be added without vendor conflicts
  const canAdd = useCallback((newItem) => {
    if (!newItem) return false;
    
    // If cart is empty, any item can be added
    if (cartItems.length === 0) return true;
    
    // Get vendor info from the new item
    const newVendor = newItem.vendor || 
                     newItem.jamRoom || 
                     newItem.ownerDetails ||
                     newItem.instrument?.vendor;
    
    if (!currentVendor || !newVendor) return false;
    
    // Check if vendors match using different ID field patterns from your codebase
    return (
      currentVendor.id === newVendor.id || 
      currentVendor._id === newVendor._id ||
      currentVendor.jamRoomId === newVendor.jamRoomId ||
      currentVendor.email === newVendor.email
    );
  }, [cartItems, currentVendor]);

  // Find items that conflict with a potential new vendor
  const getConflictingItems = useCallback((newVendor) => {
    if (!newVendor || cartItems.length === 0) return [];
    
    return cartItems.filter(item => {
      const itemVendor = item.vendor || 
                        item.jamRoom || 
                        item.ownerDetails ||
                        item.instrument?.vendor;
      if (!itemVendor) return false;
      
      // Check for mismatched vendor IDs
      return !(
        itemVendor.id === newVendor.id || 
        itemVendor._id === newVendor._id ||
        itemVendor.jamRoomId === newVendor.jamRoomId ||
        itemVendor.email === newVendor.email
      );
    });
  }, [cartItems]);

  // Get conflicting items for the pending item
  const conflictingItems = useMemo(() => {
    if (!pendingItem) return [];
    const newVendor = pendingItem.vendor || 
                     pendingItem.jamRoom || 
                     pendingItem.ownerDetails ||
                     pendingItem.instrument?.vendor;
    return getConflictingItems(newVendor);
  }, [pendingItem, getConflictingItems]);

  // Enhanced clearAndAdd with toast notifications
  const clearAndAdd = useCallback((newItem, options = {}) => {
    try {
      const { skipToast = false, customMessage = null } = options;
      
      if (!updateCart) {
        console.warn('updateCart function not provided to useVendorConstraint');
        return false;
      }

      const newVendor = newItem.vendor || 
                       newItem.jamRoom || 
                       newItem.ownerDetails ||
                       newItem.instrument?.vendor;
      
      const newVendorName = getVendorName(newVendor);
      const conflictCount = conflictingItems.length;

      // Clear existing cart items and add new item
      updateCart([newItem]);
      
      // Clear pending state
      setPendingItem(null);
      setShowConflictModal(false);

      // Show success toast
      if (!skipToast) {
        const message = customMessage || 
          `Cart cleared! Added item from ${newVendorName}. ${conflictCount} conflicting item${conflictCount !== 1 ? 's' : ''} removed.`;
        
        toast.success(message, {
          duration: 4000,
          position: 'bottom-center',
        });
      }

      return true;
    } catch (error) {
      console.error('Error in clearAndAdd:', error);
      toast.error('Failed to update cart. Please try again.');
      return false;
    }
  }, [updateCart, conflictingItems.length, getVendorName]);

  // Enhanced add item with vendor constraint checking and toast notifications
  const addWithConstraintCheck = useCallback((newItem, addItemCallback = null) => {
    try {
      if (!newItem) {
        toast.error('Invalid item selected');
        return false;
      }

      // If cart is empty, add directly
      if (cartItems.length === 0) {
        if (addItemCallback) {
          addItemCallback(newItem);
        } else if (updateCart) {
          updateCart([...cartItems, newItem]);
        }
        
        const vendorName = getVendorName(newItem.vendor || newItem.jamRoom || newItem.ownerDetails);
        toast.success(`Added to cart from ${vendorName}`);
        return true;
      }

      // Check for vendor conflict
      if (!canAdd(newItem)) {
        const newVendor = newItem.vendor || 
                         newItem.jamRoom || 
                         newItem.ownerDetails ||
                         newItem.instrument?.vendor;
        const newVendorName = getVendorName(newVendor);
        
        // Set pending item for conflict resolution
        setPendingItem(newItem);
        setShowConflictModal(true);
        
        // Show warning toast
        toast.error(
          `Cannot mix items from different vendors! Cart has items from ${currentVendorName}. Clear cart to add from ${newVendorName}?`,
          {
            duration: 6000,
            position: 'bottom-center',
          }
        );
        
        return false;
      }

      // Add item if no conflict
      if (addItemCallback) {
        addItemCallback(newItem);
      } else if (updateCart) {
        updateCart([...cartItems, newItem]);
      }
      
      toast.success('Added to cart');
      return true;
      
    } catch (error) {
      console.error('Error adding item with constraint check:', error);
      toast.error('Failed to add item to cart');
      return false;
    }
  }, [cartItems, canAdd, currentVendorName, getVendorName, updateCart]);

  // Set pending item for conflict resolution
  const setPendingConflict = useCallback((item) => {
    setPendingItem(item);
    setShowConflictModal(true);
  }, []);

  // Clear pending conflict
  const clearPendingConflict = useCallback(() => {
    setPendingItem(null);
    setShowConflictModal(false);
  }, []);

  // Check if there's a vendor conflict for a specific item
  const hasVendorConflict = useCallback((newItem) => {
    return cartItems.length > 0 && !canAdd(newItem);
  }, [cartItems, canAdd]);

  // Check if cart has items from multiple vendors (error state)
  const hasMultipleVendors = useMemo(() => {
    if (cartItems.length <= 1) return false;
    
    const firstVendor = cartItems[0]?.vendor || 
                       cartItems[0]?.jamRoom || 
                       cartItems[0]?.ownerDetails ||
                       cartItems[0]?.instrument?.vendor;
    if (!firstVendor) return false;
    
    return cartItems.some(item => {
      const itemVendor = item.vendor || 
                        item.jamRoom || 
                        item.ownerDetails ||
                        item.instrument?.vendor;
      if (!itemVendor) return true;
      
      return !(
        itemVendor.id === firstVendor.id || 
        itemVendor._id === firstVendor._id ||
        itemVendor.jamRoomId === firstVendor.jamRoomId ||
        itemVendor.email === firstVendor.email
      );
    });
  }, [cartItems]);

  // Get cart summary with vendor info
  const cartSummary = useMemo(() => {
    return {
      itemCount: cartItems.length,
      isEmpty: cartItems.length === 0,
      vendorName: currentVendorName,
      hasConflicts: hasMultipleVendors,
      canAddFrom: (vendor) => {
        if (cartItems.length === 0) return true;
        const vendorToCheck = vendor || {};
        return (
          currentVendor?.id === vendorToCheck.id ||
          currentVendor?._id === vendorToCheck._id ||
          currentVendor?.jamRoomId === vendorToCheck.jamRoomId ||
          currentVendor?.email === vendorToCheck.email
        );
      }
    };
  }, [cartItems.length, currentVendorName, hasMultipleVendors, currentVendor]);

  return {
    // Main constraint check
    canAdd,
    
    // Current vendor info
    currentVendor,
    currentVendorName,
    
    // Conflict management
    conflictingItems,
    hasVendorConflict,
    hasMultipleVendors,
    showConflictModal,
    
    // Conflict resolution
    clearAndAdd,
    addWithConstraintCheck,
    setPendingConflict,
    clearPendingConflict,
    pendingItem,
    
    // Utility functions
    getConflictingItems,
    getVendorName,
    
    // Cart state and summary
    cartSummary,
    
    // Modal state
    setShowConflictModal,
    
    // Legacy compatibility
    isEmpty: cartItems.length === 0,
    itemCount: cartItems.length,
  };
};

export default useVendorConstraint;