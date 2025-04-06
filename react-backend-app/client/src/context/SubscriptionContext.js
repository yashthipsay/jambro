import React, { createContext, useContext, useState, useEffect } from "react";
import { useAuth0 } from "@auth0/auth0-react";

const SubscriptionContext = createContext();

export function SubscriptionProvider({ children }) {
  const { isAuthenticated, user } = useAuth0();
  const [subscription, setSubscription] = useState(null);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

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

  // Fetch subscription data from backend
  useEffect(() => {
    const fetchSubscription = async () => {
      if (!isAuthenticated || !user) return;

      try {
        setLoading(true);
        setError(null);

        // First get userId from database
        const userResponse = await fetch("https://api.vision.gigsaw.co.in/api/users", {
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
          `https://api.vision.gigsaw.co.in/api/subscriptions/user/${userData.data._id}`
        );

        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const data = await response.json();
        console.log("Subscription data from backend:", data);

        if (data.success && data.data) {
          // Transform backend fields to frontend format
          const backendSubscription = data.data;

          const transformedSubscription = {
            ...backendSubscription,
            tier:
              backendSubscription.tier?.toLowerCase() ||
              backendSubscription.name?.toLowerCase(),
            access: transformAccessType(backendSubscription.accessType),
            frequency: transformFrequency(backendSubscription.duration),
            hours:
              backendSubscription.hoursPerMonth ||
              backendSubscription.remainingHours,
            nextBilling: backendSubscription.endDate
              ? new Date(backendSubscription.endDate).toLocaleDateString()
              : "N/A",
            type: backendSubscription.type || "INDIVIDUAL",
          };

          console.log("Transformed subscription:", transformedSubscription);
          setSubscription(transformedSubscription);
        }
      } catch (error) {
        console.error("Error fetching subscription:", error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchSubscription();
  }, [isAuthenticated, user]);

  // Helper functions for data transformation
  const transformAccessType = (accessType) => {
    if (!accessType) return "jamrooms";

    const type = accessType.toLowerCase();
    if (type === "jam_room") return "jamrooms";
    if (type === "studio") return "studios";
    if (type === "both") return "both";
    return "jamrooms";
  };

  const transformFrequency = (duration) => {
    if (!duration) return "monthly";

    if (duration === 1) return "monthly";
    if (duration === 6) return "half_yearly";
    if (duration === 12) return "annual";
    return "monthly";
  };

  const updateSubscription = (newSubscription) => {
    if (typeof newSubscription === "function") {
      setSubscription((prev) => newSubscription(prev));
    } else {
      setSubscription(newSubscription);
    }
  };

  const cancelSubscription = async (cancelAtCycleEnd = false) => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(
        "https://api.vision.gigsaw.co.in/api/subscriptions/cancel",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            subscriptionId: subscription.razorpaySubscriptionId,
            cancelAtCycleEnd,
          }),
        }
      );

      const data = await response.json();

      if (data.success) {
        setSubscription((prev) => ({
          ...prev,
          status: cancelAtCycleEnd ? "ACTIVE" : "CANCELLED",
          pendingCancellation: cancelAtCycleEnd,
          cancelAtEnd: cancelAtCycleEnd,
          cancelledAt: cancelAtCycleEnd ? null : new Date(),
        }));
        setShowCancelDialog(false);
      } else {
        throw new Error(data.message || "Failed to cancel subscription");
      }
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SubscriptionContext.Provider
      value={{
        subscription,
        updateSubscription,
        cancelSubscription,
        showCancelDialog,
        setShowCancelDialog,
        loading,
        error
      }}
    >
      {children}
    </SubscriptionContext.Provider>
  );
}

export const useSubscription = () => useContext(SubscriptionContext);
