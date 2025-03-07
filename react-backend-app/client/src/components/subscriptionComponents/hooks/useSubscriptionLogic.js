import { useState } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import { useNavigate } from "react-router-dom";

export const useSubscriptionLogic = () => {
  const navigate = useNavigate();
  const { isAuthenticated, loginWithRedirect } = useAuth0();

  // State for tier selections
  const [selections, setSelections] = useState({
    basic: { hours: 25, frequency: "monthly" },
    pro: { hours: 25, access: "jamrooms", frequency: "monthly" },
    premium: { hours: 25, access: "both", frequency: "monthly" },
  });

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
    console.log(`Subscription selected:`, {
      tier,
      hours,
      access: access || "jamrooms", // Default for Basic tier
      frequency,
      pricing: calculatePrice(tier, hours, access || "jamrooms", frequency),
    });

    // In a real implementation, you would navigate to a checkout page
    // navigate('/checkout', { state: { subscription: { tier, hours, access, frequency } } });
  };

  return {
    selections,
    handleSelectionChange,
    calculatePrice,
    handleSubscribe,
  };
};