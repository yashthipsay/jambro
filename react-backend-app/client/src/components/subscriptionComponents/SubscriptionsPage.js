import React from "react";
import { Box, Typography } from "@mui/material";
import TierCard from "./TierCard";
import SubscriptionFAQ from "./SubscriptionFAQ";
import { useSubscriptionLogic } from "./hooks/useSubscriptionLogic";

// Define color constants used throughout all subscription components
export const subscriptionColors = {
  primaryColor: "#6434fc", 
  secondaryColor: "#a085eb",
  accentColor: "#8059f7",
  backgroundColor: "#f8f6ff",
  cardBackground: "#ffffff", 
  textColor: "#352c63",
  lightTextColor: "#dcd5ff",
};

const SubscriptionsPage = () => {
  const { 
    selections, 
    handleSelectionChange, 
    calculatePrice, 
    handleSubscribe 
  } = useSubscriptionLogic();

  return (
    <Box
      sx={{
        backgroundColor: subscriptionColors.backgroundColor,
        minHeight: "100vh",
        backgroundImage: `radial-gradient(circle at 50% 0%, #e9e4ff 0%, ${subscriptionColors.backgroundColor} 70%)`,
        py: 8,
        px: 4,
      }}
    >
      <Box maxWidth={1200} mx="auto">
        <Typography
          variant="h3"
          sx={{
            color: subscriptionColors.textColor,
            fontWeight: 700,
            textAlign: "center",
            mb: 2,
            textShadow: "0 1px 2px rgba(0,0,0,0.1)",
          }}
        >
          GigSaw Pass
        </Typography>
        <Typography
          variant="h6"
          sx={{
            color: subscriptionColors.textColor,
            opacity: 0.8,
            textAlign: "center",
            mb: 6,
            maxWidth: 700,
            mx: "auto",
          }}
        >
          Unlimited access to jamrooms and studios with flexible hours.
          All plans include Spotify Premium subscription.
        </Typography>

        <Box 
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "1fr",
              md: "repeat(3, 1fr)"
            },
            gap: 4,
            mb: 10
          }}
        >
          <TierCard
            tier="basic"
            title="Basic Pass"
            description="Perfect for casual jammers who just need jamroom access"
            isPopular={false}
            selections={selections.basic}
            onChange={(field, value) => handleSelectionChange("basic", field, value)}
            calculatePrice={calculatePrice}
            onSubscribe={handleSubscribe}
          />
          
          <TierCard
            tier="pro"
            title="Pro Pass"
            description="For musicians who need both jamrooms and recording studios"
            isPopular={true}
            selections={selections.pro}
            onChange={(field, value) => handleSelectionChange("pro", field, value)}
            calculatePrice={calculatePrice}
            onSubscribe={handleSubscribe}
            showAccessOptions={true}
          />
          
          <TierCard
            tier="premium"
            title="Premium Pass"
            description="The ultimate experience for serious musicians with premium amenities"
            isPopular={false}
            selections={selections.premium}
            onChange={(field, value) => handleSelectionChange("premium", field, value)}
            calculatePrice={calculatePrice}
            onSubscribe={handleSubscribe}
            showAccessOptions={true}
          />
        </Box>

        <SubscriptionFAQ />
      </Box>
    </Box>
  );
};

export default SubscriptionsPage;