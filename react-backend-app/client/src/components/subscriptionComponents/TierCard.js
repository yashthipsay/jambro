import React from "react";
import {
  Card,
  CardContent,
  Typography,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Divider,
  Box,
  Chip,
  useMediaQuery,
} from "@mui/material";
import { styled } from "@mui/material/styles";
import {
  MusicNote,
  Mic,
  Star,
  CheckCircle,
  AccessTime,
  ArrowUpward,
  ArrowDownward,
  Check,
} from "@mui/icons-material";
import FeatureList from "./FeatureList";
import PriceDisplay from "./PriceDisplay";
import { subscriptionColors } from "./SubscriptionsPage";

// Styled components
const StyledCard = styled(Card)(({ theme, isPopular, isActive }) => ({
  backgroundColor: subscriptionColors.cardBackground,
  boxShadow: `0 8px 24px ${
    isActive
      ? "rgba(100, 52, 252, 0.35)"
      : isPopular
      ? "rgba(100, 52, 252, 0.25)"
      : "rgba(100, 52, 252, 0.15)"
  }`,
  border: `1px solid ${
    isActive
      ? "rgba(100, 52, 252, 0.5)"
      : isPopular
      ? "rgba(100, 52, 252, 0.3)"
      : "rgba(160, 133, 235, 0.2)"
  }`,
  borderRadius: 16,
  height: "100%",
  display: "flex",
  flexDirection: "column",
  transition: "transform 0.3s ease-in-out, box-shadow 0.3s ease-in-out",
  position: "relative",
  "&:hover": {
    transform: "translateY(-8px)",
    boxShadow: `0 12px 32px ${
      isActive
        ? "rgba(100, 52, 252, 0.45)"
        : isPopular
        ? "rgba(100, 52, 252, 0.35)"
        : "rgba(100, 52, 252, 0.25)"
    }`,
  },
}));

const PopularFlag = styled(Box)(({ theme }) => ({
  position: "absolute",
  top: 12,
  right: 12,
  backgroundColor: "#ff5722",
  color: "white",
  padding: "4px 12px",
  borderRadius: 12,
  fontWeight: 600,
  fontSize: 14,
  zIndex: 1,
  boxShadow: "0 2px 8px rgba(255, 87, 34, 0.4)",
}));

const ActiveFlag = styled(Box)(({ theme }) => ({
  position: "absolute",
  top: 12,
  right: 12,
  backgroundColor: "#4CAF50",
  color: "white",
  padding: "4px 12px",
  borderRadius: 12,
  fontWeight: 600,
  fontSize: 14,
  zIndex: 1,
  display: "flex",
  alignItems: "center",
  gap: "4px",
  boxShadow: "0 2px 8px rgba(76, 175, 80, 0.4)",
}));

const SpotifyChip = styled(Chip)(({ theme }) => ({
  backgroundColor: "#1DB954", // Spotify green
  color: "white",
  fontWeight: 600,
  marginTop: 8,
  marginBottom: 16,
  "& .MuiChip-icon": {
    color: "white",
  },
}));

const TierCard = ({
  tier,
  title,
  description,
  isPopular,
  selections,
  onChange,
  calculatePrice,
  onSubscribe,
  showAccessOptions = false,
  activePlan = null,
}) => {
  const isMobile = useMediaQuery("(max-width:600px)");
  const isTablet = useMediaQuery("(max-width:960px)");

  // Check if this card represents the currently active plan
  const isActive = activePlan === tier;

  // Hours options
  const hourOptions = [25, 30, 35, 40, 45];

  // Frequency options
  const frequencyOptions = [
    { value: "monthly", label: "Monthly" },
    { value: "half_yearly", label: "Half-Yearly (5% Off)" },
    { value: "annual", label: "Annual (10% Off)" },
  ];

  const price = calculatePrice(
    tier,
    selections.hours,
    selections.access || "jamrooms",
    selections.frequency || "monthly"
  );

  // Function to get appropriate button text based on active plan
  const getButtonText = () => {
    if (isActive) return "Currently Active";

    if (!activePlan) return "Subscribe Now";

    // Compare tiers to determine if this is an upgrade or downgrade
    const tierRanking = { basic: 1, pro: 2, premium: 3 };
    const currentRank = tierRanking[activePlan];
    const thisRank = tierRanking[tier];

    if (thisRank > currentRank) return isMobile ? "Upgrade" : "Upgrade Plan";
    return isMobile ? "Downgrade" : "Downgrade Plan";
  };

  // Get button icon
  const getButtonIcon = () => {
    if (isActive) return <Check fontSize="small" sx={{ mr: 0.5 }} />;

    if (!activePlan) return null;

    const tierRanking = { basic: 1, pro: 2, premium: 3 };
    const currentRank = tierRanking[activePlan];
    const thisRank = tierRanking[tier];

    if (thisRank > currentRank)
      return <ArrowUpward fontSize="small" sx={{ mr: 0.5 }} />;
    return <ArrowDownward fontSize="small" sx={{ mr: 0.5 }} />;
  };

  // Get color scheme for button
  const getButtonColor = () => {
    if (isActive)
      return {
        bg: "#4CAF50",
        hover: "#45a049",
        shadow: "rgba(76, 175, 80, 0.4)",
      };

    if (!activePlan)
      return {
        bg: subscriptionColors.primaryColor,
        hover: subscriptionColors.accentColor,
        shadow: "rgba(100, 52, 252, 0.4)",
      };

    const tierRanking = { basic: 1, pro: 2, premium: 3 };
    const currentRank = tierRanking[activePlan];
    const thisRank = tierRanking[tier];

    if (thisRank > currentRank)
      return {
        bg: "#2196F3", // Blue for upgrade
        hover: "#1976D2",
        shadow: "rgba(33, 150, 243, 0.4)",
      };

    return {
      bg: "#FF9800", // Orange for downgrade
      hover: "#F57C00",
      shadow: "rgba(255, 152, 0, 0.4)",
    };
  };

  const buttonColor = getButtonColor();

  return (
    <StyledCard isPopular={isPopular} isActive={isActive}>
      {isPopular && !isActive && <PopularFlag>Most Popular</PopularFlag>}
      {isActive && (
        <ActiveFlag>
          <Check fontSize="small" /> Current Plan
        </ActiveFlag>
      )}

      <CardContent
        sx={{
          p: isMobile ? 3 : 4,
          display: "flex",
          flexDirection: "column",
          height: "100%",
        }}
      >
        <Typography
          variant="h5"
          sx={{
            fontWeight: 700,
            color: subscriptionColors.textColor,
            mb: 1,
            fontSize: isMobile ? "1.25rem" : "1.5rem",
          }}
        >
          {title}
        </Typography>
        <Typography
          variant="body2"
          sx={{
            color: subscriptionColors.textColor,
            opacity: 0.8,
            mb: 2,
            fontSize: isMobile ? "0.875rem" : "1rem",
          }}
        >
          {description}
        </Typography>

        <SpotifyChip
          icon={<MusicNote />}
          label="Spotify Premium Included"
          size="small"
        />

        <Divider sx={{ my: 2 }} />

        <Box mb={isMobile ? 2 : 3}>
          <FormControl fullWidth size="small" sx={{ mb: 2 }}>
            <InputLabel id={`${tier}-hours-label`}>Hours</InputLabel>
            <Select
              labelId={`${tier}-hours-label`}
              id={`${tier}-hours`}
              value={selections.hours}
              label="Hours"
              onChange={(e) => onChange("hours", e.target.value)}
            >
              {/* Only offer hours that match SKU schema */}
              <MenuItem value={20}>20 hours</MenuItem>
              <MenuItem value={25}>25 hours</MenuItem>
              <MenuItem value={40}>40 hours</MenuItem>
              <MenuItem value={45}>45 hours</MenuItem>
            </Select>
          </FormControl>

          {showAccessOptions && (
            <FormControl fullWidth size="small" sx={{ mb: 2 }}>
              <InputLabel id={`${tier}-access-label`}>Access</InputLabel>
              <Select
                labelId={`${tier}-access-label`}
                id={`${tier}-access`}
                value={selections.access || "jamrooms"}
                label="Access"
                onChange={(e) => onChange("access", e.target.value)}
              >
                <MenuItem value="jamrooms">Jam Rooms</MenuItem>
                <MenuItem value="studios">Studios</MenuItem>
                <MenuItem value="both">Both</MenuItem>
              </Select>
            </FormControl>
          )}

          <FormControl fullWidth variant="outlined">
            <InputLabel id={`${tier}-frequency-label`}>
              Payment Frequency
            </InputLabel>
            <Select
              labelId={`${tier}-frequency-label`}
              id={`${tier}-frequency`}
              value={selections.frequency}
              onChange={(e) => onChange("frequency", e.target.value)}
              label="Payment Frequency"
              sx={{ color: subscriptionColors.textColor }}
              disabled={isActive}
            >
              {frequencyOptions.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>

        <FeatureList tier={tier} />

        <Box mt="auto" textAlign="center">
        <PriceDisplay 
          price={price} // Pass the calculated price directly
          frequency={selections.frequency || "monthly"}
          size="large"
          color={subscriptionColors.textColor}
        />

          <Button
            variant="contained"
            fullWidth
            size="large"
            onClick={() => onSubscribe(tier, selections)}
            disabled={isActive}
            startIcon={getButtonIcon()}
            sx={{
              mt: 2,
              backgroundColor: buttonColor.bg,
              color: "#ffffff",
              py: isMobile ? 1.2 : 1.5,
              borderRadius: 2,
              boxShadow: `0 4px 12px ${buttonColor.shadow}`,
              "&:hover": {
                backgroundColor: buttonColor.hover,
                boxShadow: `0 6px 16px ${buttonColor.shadow}`,
              },
              "&:disabled": {
                backgroundColor: "#4CAF50",
                color: "white",
                opacity: 0.9,
              },
              fontSize: isMobile ? "0.875rem" : "1rem",
            }}
          >
            {getButtonText()}
          </Button>
        </Box>
      </CardContent>
    </StyledCard>
  );
};

export default TierCard;
