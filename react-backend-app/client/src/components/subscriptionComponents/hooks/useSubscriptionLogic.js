import { useState, useEffect } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import { useNavigate } from "react-router-dom";
import { useSubscription } from "../../../context/SubscriptionContext";

export const useSubscriptionLogic = () => {
  const navigate = useNavigate();
  const { isAuthenticated, loginWithRedirect, user } = useAuth0();
  const { subscription, updateSubscription } = useSubscription();

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
  const calculatePrice = (tier, hours, access, frequency, type = 'INDIVIDUAL') => {
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
        hourlyRate =
          access === "studios" ? 1500 : access === "both" ? 1500 : 1000;
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
      discountedPrice: Math.round((inflatedPrice * (100 - discount)) / 100),
      discount,
    };
  };

  // Handle subscription button click
  const handleSubscribe = (tier, type) => {
    if (!isAuthenticated) {
      loginWithRedirect();
      return;
    }
  
    const tierSelections = selections[tier];
    const { hours, access, frequency } = tierSelections;
  
    // Determine if this is a new subscription, upgrade, or downgrade
    let actionType = "subscribe";
    if (subscription?.tier) {
      const tierRanking = { basic: 1, pro: 2, premium: 3 };
      actionType =
        tierRanking[tier] > tierRanking[subscription.tier]
          ? "upgrade"
          : "downgrade";
    }
  
    // Create new subscription object with pricing details and type
    const pricing = calculatePrice(
      tier,
      hours,
      access || "jamrooms",
      frequency,
      type
    );
  
    const newSubscription = {
      tier,
      type, // Add subscription type
      hours,
      access: access || "jamrooms",
      frequency,
      nextBilling: new Date(
        Date.now() + 30 * 24 * 60 * 60 * 1000
      ).toLocaleDateString(),
      pricing,
      actionType,
      memberEmails: [], // Initialize empty array for group members
    };
  
    // Log subscription change
    console.log(`${actionType.toUpperCase()} subscription:`, newSubscription);
  
    // Update subscription in context
    updateSubscription(newSubscription);
  
    // If it's a group subscription, navigate to member management
    if (type === 'GROUP') {
      navigate('/group-setup', { 
        state: { subscription: newSubscription }
      });
    }
  };

  return {
    selections,
    handleSelectionChange,
    calculatePrice,
    handleSubscribe,
    activePlan: subscription?.tier || null,
  };
};
