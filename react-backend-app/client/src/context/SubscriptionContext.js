import React, { createContext, useContext, useState, useEffect } from "react";
import { useAuth0 } from "@auth0/auth0-react";

const SubscriptionContext = createContext();

export function SubscriptionProvider({ children }) {
  const { isAuthenticated, user } = useAuth0();
  const [subscription, setSubscription] = useState(null);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [loading, setLoading] = useState(false);

  // Mock subscription for demo
  const mockSubscription = {
    tier: "pro",
    hours: 30,
    access: "both",
    frequency: "monthly",
    nextBilling: new Date(
      Date.now() + 30 * 24 * 60 * 60 * 1000
    ).toLocaleDateString(),
  };

  // Fetch subscription
  useEffect(() => {
    const fetchSubscription = async () => {
      if (!isAuthenticated || !user) return;

      try {
        setLoading(true);
        // First get userId from database
        const userResponse = await fetch("http://localhost:5000/api/users", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email: user.email }),
        });

        const userData = await userResponse.json();
        if (!userData.success || !userData.data._id) {
          return;
        }

        // Fetch subscription with userId
        const response = await fetch(
          `http://localhost:5000/api/subscriptions/user/${userData.data._id}`
        );
        const data = await response.json();

        if (data.success && data.data) {
          // Transform backend fields to frontend format
          const backendSubscription = data.data;

          setSubscription({
            ...backendSubscription,
            tier: backendSubscription.tier?.toLowerCase(),
            access:
              backendSubscription.accessType?.toLowerCase() === "jam_room"
                ? "jamrooms"
                : backendSubscription.accessType?.toLowerCase() === "studio"
                ? "studios"
                : "both",
            frequency:
              backendSubscription.duration === 1
                ? "monthly"
                : backendSubscription.duration === 6
                ? "half_yearly"
                : "annual",
            hours:
              backendSubscription.hoursPerMonth ||
              backendSubscription.remainingHours,
            nextBilling: new Date(
              backendSubscription.endDate
            ).toLocaleDateString(),
          });
        }
      } catch (error) {
        console.error("Error fetching subscription:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchSubscription();
  }, [isAuthenticated, user]);

  const updateSubscription = (newSubscription) => {
    if (typeof newSubscription === "function") {
      setSubscription((prev) => newSubscription(prev));
    } else {
      setSubscription(newSubscription);
    }
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
        setShowCancelDialog,
      }}
    >
      {children}
    </SubscriptionContext.Provider>
  );
}

export const useSubscription = () => useContext(SubscriptionContext);
