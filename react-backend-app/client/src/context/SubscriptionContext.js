import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth0 } from "@auth0/auth0-react";

const SubscriptionContext = createContext();

export function SubscriptionProvider({ children }) {
  const { isAuthenticated, user } = useAuth0();
  const [subscription, setSubscription] = useState(null);
  const [showCancelDialog, setShowCancelDialog] = useState(false);

  // Mock subscription for demo
  const mockSubscription = {
    tier: "pro",
    hours: 30,
    access: "both",
    frequency: "monthly",
    nextBilling: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString(),
  };

  useEffect(() => {
    // Initially set mock subscription
    // In production, fetch from your API
    if (isAuthenticated) {
      setSubscription(mockSubscription);
    }
  }, [isAuthenticated]);

  const updateSubscription = (newSubscription) => {
    setSubscription(newSubscription);
  };

  const cancelSubscription = () => {
    setSubscription(null);
    setShowCancelDialog(false);
  };

  return (
    <SubscriptionContext.Provider 
      value={{ 
        subscription, 
        updateSubscription, 
        cancelSubscription,
        showCancelDialog,
        setShowCancelDialog
      }}
    >
      {children}
    </SubscriptionContext.Provider>
  );
}

export const useSubscription = () => useContext(SubscriptionContext);