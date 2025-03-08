import { useState, useEffect } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import { useNavigate } from "react-router-dom";

export const useSubscriptionLogic = () => {
  const navigate = useNavigate();
  const { isAuthenticated, loginWithRedirect, user } = useAuth0();

  // State for tier selections
  const [selections, setSelections] = useState({
    basic: { hours: 25, frequency: "monthly" },
    pro: { hours: 25, access: "jamrooms", frequency: "monthly" },
    premium: { hours: 25, access: "both", frequency: "monthly" },
  });

    // State to track the currently active plan (if any)
    const [activePlan, setActivePlan] = useState(null);

    // Mock function to fetch active subscription
    // In a real app, you would fetch this from your backend
    useEffect(() => {
      const fetchActiveSubscription = async () => {
        if (!isAuthenticated || !user) return;
        
        try {
          // Mock API call - replace with your actual API
          // const response = await fetch(`/api/subscriptions/user/${user.sub}`);
          // const data = await response.json();
          // if (data.success && data.subscription) {
          //   setActivePlan(data.subscription.tier);
          // }
          
          // For demo purposes, let's pretend the user has the Pro plan
          // Remove this in production and replace with the actual API call above
          // setActivePlan("pro");
        } catch (error) {
          console.error("Error fetching subscription:", error);
        }
      };
      
      fetchActiveSubscription();
    }, [isAuthenticated, user]);

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
    let hourlyRate = 0;

    // Determine hourly rate based on tier and access
    switch (tier) {
      case "basic":
        hourlyRate = 350; // Fixed for Basic
        break;
      case "pro":
        hourlyRate = access === "studios" ? 800 : access === "both" ? 800 : 600;
        break;
      case "premium":
        hourlyRate = access === "studios" ? 1500 : access === "both" ? 1500 : 1000;
        break;
      default:
        hourlyRate = 350;
    }

    // Calculate base monthly price
    let basePrice = hourlyRate * hours;

    // Calculate price based on frequency (artificially inflate first, then discount)
    let inflatedPrice = basePrice;
    let discount = 0;

    if (frequency === "half_yearly") {
      inflatedPrice = Math.round(basePrice * 1.1);
      discount = 5;
    } else if (frequency === "annual") {
      inflatedPrice = Math.round(basePrice * 1.2);
      discount = 10;
    }

    return {
      basePrice: inflatedPrice, 
      discountedPrice: Math.round(inflatedPrice * (100 - discount) / 100),
      discount,
    };
  };

  // Handle subscription button click
  const handleSubscribe = (tier, selections) => {
    if (!isAuthenticated) {
      loginWithRedirect();
      return;
    }

    const { hours, access, frequency } = selections;

        // Determine if this is a new subscription, upgrade, or downgrade
        let actionType = "subscribe";
        if (activePlan) {
          const tierRanking = { basic: 1, pro: 2, premium: 3 };
          actionType = tierRanking[tier] > tierRanking[activePlan] ? "upgrade" : "downgrade";
        }

    console.log(`Subscription selected:`, {
      tier,
      hours,
      access: access || "jamrooms", // Default for Basic tier
      frequency,
      pricing: calculatePrice(tier, hours, access || "jamrooms", frequency),
    });

        // For demo purposes, set the active plan immediately
    // In a real implementation, you would navigate to checkout and only update after payment
    setActivePlan(tier);

    // In a real implementation, you would navigate to a checkout page
    // navigate('/checkout', { state: { subscription: { tier, hours, access, frequency } } });
  };

  return {
    selections,
    handleSelectionChange,
    calculatePrice,
    handleSubscribe,
    activePlan,
  };
};