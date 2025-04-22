import React, { useState } from "react";
import { Box, Typography, useMediaQuery, Paper, Button } from "@mui/material";
import TierCard from "./TierCard";
import SubscriptionFAQ from "./SubscriptionFAQ";
import { useSubscriptionLogic } from "./hooks/useSubscriptionLogic";
import SubscriptionTypeModal from "./SubscriptionTypeModal";
import { CalendarCheck, Clock, ArrowUpCircle, Star } from "lucide-react";

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

// Commented out existing implementation
/*
const SubscriptionsPage = () => {
  const {
    selections,
    handleSelectionChange,
    calculatePrice,
    handleSubscribe,
    activePlan,
    subscription,
    handleUpdateSubscription,
  } = useSubscriptionLogic();

  const handleTierClick = (tier) => {
    handleSubscribe(tier, "INDIVIDUAL");
  };

  const handlePlanChange = (newTier) => {
    if (newTier === activePlan) {
      handleUpdateSubscription(newTier);
    }
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
              {activePlan.charAt(0).toUpperCase() + activePlan.slice(1)} plan.
              You can modify your current plan's options below.
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
            onUpgrade={handlePlanChange}
            isCurrentPlan={activePlan === "basic"}
            subscription={subscription}
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
            onUpgrade={handlePlanChange}
            isCurrentPlan={activePlan === "pro"}
            subscription={subscription}
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
            onUpgrade={handlePlanChange}
            isCurrentPlan={activePlan === "premium"}
            subscription={subscription}
          />
        </Box>

        <SubscriptionFAQ />
      </Box>
    </Box>
  );
};
*/

// Temporary implementation with coming soon message
const SubscriptionsPage = () => {
  const isMobile = useMediaQuery("(max-width:600px)");
  const { activePlan, subscription } = useSubscriptionLogic();

  return (
    <Box
      sx={{
        backgroundColor: subscriptionColors.backgroundColor,
        minHeight: "100vh",
        backgroundImage: `radial-gradient(circle at 50% 0%, #e9e4ff 0%, ${subscriptionColors.backgroundColor} 70%)`,
        py: isMobile ? 4 : 8,
        px: isMobile ? 2 : 4,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Box maxWidth={1000} mx="auto" textAlign="center" px={3}>
        <Typography
          variant="h2"
          sx={{
            color: subscriptionColors.textColor,
            fontWeight: 700,
            mb: 2,
            fontSize: isMobile ? "2.5rem" : "3.5rem",
            textShadow: "0 2px 4px rgba(0,0,0,0.1)",
            background: `linear-gradient(135deg, ${subscriptionColors.primaryColor}, ${subscriptionColors.accentColor})`,
            backgroundClip: "text",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          GigSaw Pass
        </Typography>

        <Typography
          variant="h5"
          component="div"
          sx={{
            color: subscriptionColors.textColor,
            opacity: 0.8,
            mb: 5,
            fontWeight: 500,
            maxWidth: 800,
            mx: "auto",
          }}
        >
          Coming in our next update!
        </Typography>

        <Paper
          elevation={8}
          sx={{
            p: isMobile ? 3 : 6,
            mb: 6,
            background: "rgba(255, 255, 255, 0.9)",
            borderRadius: 4,
            maxWidth: 900,
            mx: "auto",
            backdropFilter: "blur(10px)",
            border: `1px solid ${subscriptionColors.secondaryColor}20`,
            boxShadow: `0 10px 40px -10px ${subscriptionColors.accentColor}40`,
          }}
        >
          <Typography
            variant="h4"
            sx={{
              color: subscriptionColors.textColor,
              fontWeight: 600,
              mb: 3,
            }}
          >
            Elevate Your Music Experience
          </Typography>

          <Typography
            variant="body1"
            sx={{
              mb: 4,
              fontSize: "1.1rem",
              color: subscriptionColors.textColor,
            }}
          >
            We're excited to announce that the GigSaw Pass is coming soon! Our
            subscription service will revolutionize how you book and access
            music spaces across the platform.
          </Typography>

          <Box
            sx={{
              display: "flex",
              flexDirection: isMobile ? "column" : "row",
              gap: 4,
              mb: 5,
            }}
          >
            <Box
              sx={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                p: 2,
              }}
            >
              <CalendarCheck
                size={48}
                color={subscriptionColors.primaryColor}
                strokeWidth={1.5}
              />
              <Typography
                variant="h6"
                sx={{
                  my: 2,
                  fontWeight: 600,
                  color: subscriptionColors.textColor,
                }}
              >
                Priority Booking
              </Typography>
              <Typography
                variant="body2"
                color="text.secondary"
                textAlign="center"
              >
                Get priority access to popular jam rooms and studios with
                exclusive time slots reserved for Pass members.
              </Typography>
            </Box>

            <Box
              sx={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                p: 2,
              }}
            >
              <Clock
                size={48}
                color={subscriptionColors.primaryColor}
                strokeWidth={1.5}
              />
              <Typography
                variant="h6"
                sx={{
                  my: 2,
                  fontWeight: 600,
                  color: subscriptionColors.textColor,
                }}
              >
                Multiple Bookings
              </Typography>
              <Typography
                variant="body2"
                color="text.secondary"
                textAlign="center"
              >
                Book multiple sessions in advance without waiting for your
                previous booking to complete. Perfect for consistent practice
                schedules.
              </Typography>
            </Box>

            <Box
              sx={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                p: 2,
              }}
            >
              <Star
                size={48}
                color={subscriptionColors.primaryColor}
                strokeWidth={1.5}
              />
              <Typography
                variant="h6"
                sx={{
                  my: 2,
                  fontWeight: 600,
                  color: subscriptionColors.textColor,
                }}
              >
                Premium Benefits
              </Typography>
              <Typography
                variant="body2"
                color="text.secondary"
                textAlign="center"
              >
                Enjoy special rates, exclusive equipment access, and additional
                perks at participating locations.
              </Typography>
            </Box>
          </Box>

          <Typography
            variant="body1"
            sx={{ mb: 4, fontWeight: 500, color: subscriptionColors.textColor }}
          >
            The GigSaw Pass will offer tiered plans to match your needs - from
            casual jammers to professional musicians requiring both jam rooms
            and recording studios.
          </Typography>

          <Button
            variant="contained"
            startIcon={<ArrowUpCircle size={20} />}
            disabled
            sx={{
              backgroundColor: subscriptionColors.primaryColor,
              py: 1.5,
              px: 4,
              fontSize: "1.1rem",
              "&:hover": {
                backgroundColor: subscriptionColors.accentColor,
              },
              "&.Mui-disabled": {
                backgroundColor: subscriptionColors.secondaryColor,
                color: "white",
                opacity: 0.7,
              },
            }}
          >
            Coming Soon
          </Button>
        </Paper>

        {/* Leave the FAQ component as is */}
        <SubscriptionFAQ />
      </Box>
    </Box>
  );
};

export default SubscriptionsPage;
