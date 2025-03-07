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
} from "@mui/material";
import { styled } from "@mui/material/styles";
import {
  MusicNote,
  Mic,
  Star,
  CheckCircle,
  AccessTime,
} from "@mui/icons-material";
import FeatureList from "./FeatureList";
import PriceDisplay from "./PriceDisplay";
import { subscriptionColors } from "./SubscriptionsPage";

// Styled components
const StyledCard = styled(Card)(({ theme, isPopular }) => ({
  backgroundColor: subscriptionColors.cardBackground,
  boxShadow: `0 8px 24px ${isPopular ? 'rgba(100, 52, 252, 0.25)' : 'rgba(100, 52, 252, 0.15)'}`,
  border: `1px solid ${isPopular ? 'rgba(100, 52, 252, 0.3)' : 'rgba(160, 133, 235, 0.2)'}`,
  borderRadius: 16,
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  transition: 'transform 0.3s ease-in-out, box-shadow 0.3s ease-in-out',
  position: 'relative',
  '&:hover': {
    transform: 'translateY(-8px)',
    boxShadow: `0 12px 32px ${isPopular ? 'rgba(100, 52, 252, 0.35)' : 'rgba(100, 52, 252, 0.25)'}`,
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
}) => {
  // Hours options
  const hourOptions = [25, 30, 35, 40, 45];

  // Frequency options
  const frequencyOptions = [
    { value: "monthly", label: "Monthly" },
    { value: "half_yearly", label: "Half-Yearly (5% Off)" },
    { value: "annual", label: "Annual (10% Off)" },
  ];

  const pricing = calculatePrice(
    tier,
    selections.hours,
    selections.access || "jamrooms",
    selections.frequency
  );

  return (
    <StyledCard isPopular={isPopular}>
      {isPopular && <PopularFlag>Most Popular</PopularFlag>}
      <CardContent sx={{ p: 4, display: 'flex', flexDirection: 'column', height: '100%' }}>
        <Typography
          variant="h5"
          sx={{ fontWeight: 700, color: subscriptionColors.textColor, mb: 1 }}
        >
          {title}
        </Typography>
        <Typography
          variant="body2"
          sx={{ color: subscriptionColors.textColor, opacity: 0.8, mb: 2 }}
        >
          {description}
        </Typography>

        <SpotifyChip
          icon={<MusicNote />}
          label="Spotify Premium Included"
          size="small"
        />

        <Divider sx={{ my: 2 }} />

        <Box mb={3}>
          <FormControl fullWidth variant="outlined" sx={{ mb: 3 }}>
            <InputLabel id={`${tier}-hours-label`}>Hours per month</InputLabel>
            <Select
              labelId={`${tier}-hours-label`}
              id={`${tier}-hours`}
              value={selections.hours}
              onChange={(e) => onChange("hours", e.target.value)}
              label="Hours per month"
              sx={{ color: subscriptionColors.textColor }}
            >
              {hourOptions.map((hour) => (
                <MenuItem key={hour} value={hour}>
                  {hour} hours
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {showAccessOptions && (
            <FormControl fullWidth variant="outlined" sx={{ mb: 3 }}>
              <InputLabel id={`${tier}-access-label`}>Access Type</InputLabel>
              <Select
                labelId={`${tier}-access-label`}
                id={`${tier}-access`}
                value={selections.access}
                onChange={(e) => onChange("access", e.target.value)}
                label="Access Type"
                sx={{ color: subscriptionColors.textColor }}
              >
                <MenuItem value="jamrooms">
                  Jamrooms Only (₹{tier === "pro" ? "600" : "1000"}/hr)
                </MenuItem>
                <MenuItem value="studios">
                  Studios Only (₹{tier === "pro" ? "800" : "1500"}/hr)
                </MenuItem>
                <MenuItem value="both">Both Jamrooms & Studios</MenuItem>
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
          <PriceDisplay pricing={pricing} />

          <Button
            variant="contained"
            fullWidth
            size="large"
            onClick={() => onSubscribe(tier, selections)}
            sx={{
              mt: 2,
              backgroundColor: subscriptionColors.primaryColor,
              color: "#ffffff",
              py: 1.5,
              borderRadius: 2,
              boxShadow: "0 4px 12px rgba(100, 52, 252, 0.3)",
              "&:hover": {
                backgroundColor: subscriptionColors.accentColor,
                boxShadow: "0 6px 16px rgba(100, 52, 252, 0.4)",
              },
            }}
          >
            Subscribe Now
          </Button>
        </Box>
      </CardContent>
    </StyledCard>
  );
};

export default TierCard;