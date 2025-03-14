import { useState, useEffect } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import { useNavigate } from "react-router-dom";
import { useSubscription } from "../../../context/SubscriptionContext";

export const useSubscriptionLogic = () => {
  const navigate = useNavigate();
  const { isAuthenticated, loginWithRedirect, user } = useAuth0();
  const { subscription, updateSubscription } = useSubscription();

  // State for tier selections - default values matching SKU schema
  const [selections, setSelections] = useState({
    basic: { hours: 20, frequency: "monthly" }, // Start with 20 hours
    pro: { hours: 20, access: "jamrooms", frequency: "monthly" },
    premium: { hours: 20, access: "both", frequency: "monthly" },
  });

  const tierRanking = {
    basic: 1,
    pro: 2,
    premium: 3,
  };

  // State to track the currently active plan (if any)
  const [activePlan, setActivePlan] = useState(null);

  // Mock function to fetch active subscription
  // In a real app, you would fetch this from your backend
  // Fetch active subscription
  useEffect(() => {
    const fetchActiveSubscription = async () => {
      if (!isAuthenticated || !user) return;

      // If subscription is already in context, use it
      if (subscription) {
        setActivePlan(subscription.tier?.toLowerCase() || null);
      }
    };

    fetchActiveSubscription();
  }, [isAuthenticated, user, subscription]);

  // Handler for selection changes
  const handleSelectionChange = (tier, field, value) => {
    setSelections((prev) => ({
      ...prev,
      [tier]: {
        ...prev[tier],
        [field]: value,
      },
    }));
  };

  // Pricing logic
  const calculatePrice = (tier, hours, access, frequency) => {
    let basePrice = 0;

    // Base prices for each tier at 20 hours
    switch (tier) {
      case "basic":
        basePrice = 1999;
        break;
      case "pro":
        basePrice = 2999;
        break;
      case "premium":
        basePrice = 3999;
        break;
      default:
        basePrice = 1999;
    }

    // Add price for additional hours (every 5 hours adds 500)
    if (hours > 20) {
      basePrice += Math.floor((hours - 20) / 5) * 500;
    }

    // Add access type cost - matches exactly with SKUs
    if (access === "studios") {
      basePrice += 1000;
    } else if (access === "both") {
      basePrice += 2000;
    }

    // Apply frequency multiplier
    if (frequency === "half_yearly") {
      basePrice *= 6;
    } else if (frequency === "annual") {
      basePrice *= 12;
    }

    return basePrice;
  };

  // Handle subscription button click
  const handleSubscribe = async (tier, type) => {
    if (!isAuthenticated) {
      loginWithRedirect();
      return;
    }

    try {
      const tierSelections = selections[tier];
      const { hours, access = "jamrooms", frequency } = tierSelections;

      // Map frontend values to match SKU schema
      const mappedTier = tier.toUpperCase(); // Convert tier to uppercase
      const mappedFrequency =
        frequency === "monthly" ? 1 : frequency === "half_yearly" ? 6 : 12; // Map frequency to duration
      // Careful mapping of access types to match SKU schema
      let mappedAccess;
      if (tier === "basic") {
        // Basic tier only supports JAM_ROOM
        mappedAccess = "JAM_ROOM";
      } else {
        // Pro and Premium tiers support all access types
        mappedAccess = access
          .toUpperCase()
          .replace("JAMROOMS", "JAM_ROOM")
          .replace("STUDIOS", "STUDIO");
      }

      // First get the database userId
      const userResponse = await fetch("http://localhost:5000/api/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: user.email }),
      });

      const userData = await userResponse.json();
      if (!userData.success) {
        throw new Error("Failed to get user details");
      }

      const dbUserId = userData.data._id;

      // Create subscription through backend
      const response = await fetch(
        "http://localhost:5000/api/subscriptions/purchase",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            userId: dbUserId,
            type: "INDIVIDUAL", // Always INDIVIDUAL
            tier: mappedTier,
            hours,
            access: mappedAccess,
            frequency: mappedFrequency,
          }),
        }
      );

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.message);
      }

      const { subscription: newSubscription, checkoutOptions } = data.data;

      // Update local subscription context
      updateSubscription({
        ...newSubscription,
        type,
        tier: tier.toLowerCase(), // Keep lowercase for frontend consistency
        hours,
        access: access || "jamrooms",
        frequency: frequency || "monthly",
        status: "PENDING",
      });

      // Initialize Razorpay checkout
      const rzp = new window.Razorpay({
        ...checkoutOptions,
        handler: async function (response) {
          try {
            // Verify payment
            const verifyResponse = await fetch(
              "http://localhost:5000/api/subscriptions/verify-payment",
              {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_subscription_id: response.razorpay_subscription_id,
                  razorpay_signature: response.razorpay_signature,
                }),
              }
            );

            const verifyData = await verifyResponse.json();
            if (!verifyData.success) {
              throw new Error("Payment verification failed");
            }

            // Update local subscription with verified status
            updateSubscription((prev) => ({
              ...prev,
              status: "ACTIVE",
            }));

            // Navigate based on subscription type
            if (type === "GROUP") {
              navigate("/group-setup");
            } else {
              navigate("/subscriptions");
            }
          } catch (error) {
            console.error("Payment verification error:", error);
          }
        },
      });

      // Open the popup
      rzp.open();
    } catch (error) {
      console.error("Subscription error:", error);
      // Add error handling here
    }
  };

  return {
    selections,
    handleSelectionChange,
    calculatePrice,
    handleSubscribe,
    activePlan: subscription?.tier || null,
    subscription,
  };
};
