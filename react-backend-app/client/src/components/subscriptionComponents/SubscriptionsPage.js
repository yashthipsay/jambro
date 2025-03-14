import React, { useState } from "react";
import { Box, Typography, useMediaQuery } from "@mui/material";
import TierCard from "./TierCard";
import SubscriptionFAQ from "./SubscriptionFAQ";
import { useSubscriptionLogic } from "./hooks/useSubscriptionLogic";
import SubscriptionTypeModal from "./SubscriptionTypeModal";

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
  const [typeModalOpen, setTypeModalOpen] = useState(false);
  const [selectedTier, setSelectedTier] = useState(null);
  const {
    selections,
    handleSelectionChange,
    calculatePrice,
    handleSubscribe,
    activePlan,
    subscription,
  } = useSubscriptionLogic();

  const handleTierClick = (tier) => {
    setSelectedTier(tier);
    setTypeModalOpen(true);
  };

  const handleTypeSelect = (type, tier) => {
    handleSubscribe(tier, type);
    setTypeModalOpen(false);
  };

  const isMobile = useMediaQuery("(max-width:600px)");
  const isTablet = useMediaQuery("(max-width:960px)");

  return (
    <Box
      sx={{
        backgroundColor: subscriptionColors.backgroundColor,
        minHeight: "100vh",
        backgroundImage: `radial-gradient(circle at 50% 0%, #e9e4ff 0%, ${subscriptionColors.backgroundColor} 70%)`,
        py: isMobile ? 4 : 8,
        px: isMobile ? 2 : 4,
      }}
    >
      <Box maxWidth={1200} mx="auto">
        <Typography
          variant="h3"
          sx={{
            color: subscriptionColors.textColor,
            fontWeight: 700,
            textAlign: "center",
            mb: 1,
            mt: isMobile ? 2 : 0,
            fontSize: isMobile ? "2rem" : "2.5rem",
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
            mb: isMobile ? 4 : 6,
            maxWidth: 700,
            mx: "auto",
            fontSize: isMobile ? "1rem" : "1.25rem",
          }}
        >
          Unlimited access to jamrooms and studios with flexible hours. All
          plans include Spotify Premium subscription.
        </Typography>

        {activePlan && (
          <Box
            sx={{
              textAlign: "center",
              mb: 4,
              p: 2,
              backgroundColor: "rgba(76, 175, 80, 0.1)",
              borderRadius: 2,
              border: "1px solid rgba(76, 175, 80, 0.3)",
            }}
          >
            <Typography
              variant="body1"
              sx={{
                color: "#4CAF50",
                fontWeight: 500,
              }}
            >
              You currently have the{" "}
              {activePlan.charAt(0).toUpperCase() + activePlan.slice(1)} plan
              active
            </Typography>
          </Box>
        )}

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "1fr",
              sm: "1fr",
              md: "repeat(3, 1fr)",
            },
            gap: isMobile ? 3 : 4,
            mb: isMobile ? 6 : 10,
          }}
        >
          <TierCard
            tier="basic"
            title="Basic Pass"
            description="Perfect for casual jammers who just need jamroom access"
            isPopular={false}
            selections={selections.basic}
            onChange={(field, value) =>
              handleSelectionChange("basic", field, value)
            }
            calculatePrice={calculatePrice}
            onSubscribe={() => handleTierClick("basic")}
            activePlan={activePlan}
          />

          <TierCard
            tier="pro"
            title="Pro Pass"
            description="For musicians who need both jamrooms and recording studios"
            isPopular={!activePlan}
            selections={selections.pro}
            onChange={(field, value) =>
              handleSelectionChange("pro", field, value)
            }
            calculatePrice={calculatePrice}
            onSubscribe={() => handleTierClick("pro")}
            showAccessOptions={true}
            activePlan={activePlan}
          />

          <TierCard
            tier="premium"
            title="Premium Pass"
            description="The ultimate experience for serious musicians with premium amenities"
            isPopular={false}
            selections={selections.premium}
            onChange={(field, value) =>
              handleSelectionChange("premium", field, value)
            }
            calculatePrice={calculatePrice}
            onSubscribe={() => handleTierClick("premium")}
            showAccessOptions={true}
            activePlan={activePlan}
          />
        </Box>

        <SubscriptionFAQ />

        <SubscriptionTypeModal
          open={typeModalOpen}
          onClose={() => setTypeModalOpen(false)}
          onSelect={handleTypeSelect}
          tier={selectedTier}
        />
      </Box>
    </Box>
  );
};

export default SubscriptionsPage;
