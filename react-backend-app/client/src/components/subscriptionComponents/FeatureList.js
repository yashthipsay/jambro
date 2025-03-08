import React from "react";
import { Box, Typography, useMediaQuery } from "@mui/material";
import { styled } from "@mui/material/styles";
import {
  MusicNote,
  Mic,
  Star,
  CheckCircle,
  AccessTime,
} from "@mui/icons-material";
import { subscriptionColors } from "./SubscriptionsPage";

const FeatureItem = styled(Box)(({ theme, isMobile }) => ({
  display: "flex",
  alignItems: "center",
  marginBottom: isMobile ? 8 : 12,
  color: subscriptionColors.textColor,
  transition: "transform 0.2s ease",
  "&:hover": {
    transform: "translateX(4px)",
  },
}));

const FeatureIcon = styled(Box)(({ theme, isMobile }) => ({
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  flexShrink: 0,
  marginRight: isMobile ? 6 : 8,
  width: isMobile ? 18 : 24,
}));

const FeatureText = styled(Typography)(({ theme, isMobile }) => ({
  fontSize: isMobile ? "0.85rem" : "0.875rem",
  lineHeight: isMobile ? 1.3 : 1.5,
  fontWeight: 400,
  flexGrow: 1,
}));

const FeatureList = ({ tier }) => {
  const isMobile = useMediaQuery('(max-width:600px)');
  const isTablet = useMediaQuery('(max-width:960px)');
  
  // Determine icon size based on screen size
  const iconSize = isMobile ? "small" : "small";
  const iconMargin = isMobile ? 6 : 8;

  // Generate feature list based on tier
  const getFeatures = (tier) => {
    const baseFeatures = [
      {
        icon: <Star fontSize={iconSize} style={{ color: "#1DB954", marginRight: iconMargin }} />,
        text: "Spotify Premium included",
        important: true,
      },
      {
        icon: (
          <AccessTime
            fontSize={iconSize}
            style={{ color: subscriptionColors.primaryColor, marginRight: iconMargin }}
          />
        ),
        text: "Flexible booking hours",
        important: false,
      },
    ];

    switch (tier) {
      case "basic":
        return [
          ...baseFeatures,
          {
            icon: (
              <MusicNote
                fontSize={iconSize}
                style={{ color: subscriptionColors.primaryColor, marginRight: iconMargin }}
              />
            ),
            text: "Access to all jamrooms",
            important: true,
          },
          {
            icon: (
              <CheckCircle
                fontSize={iconSize}
                style={{ color: subscriptionColors.primaryColor, marginRight: iconMargin }}
              />
            ),
            text: "Priority booking slots",
            important: false,
          },
        ];
      case "pro":
        return [
          ...baseFeatures,
          {
            icon: (
              <MusicNote
                fontSize={iconSize}
                style={{ color: subscriptionColors.primaryColor, marginRight: iconMargin }}
              />
            ),
            text: "Access to all jamrooms",
            important: true,
          },
          {
            icon: (
              <Mic
                fontSize={iconSize}
                style={{ color: subscriptionColors.primaryColor, marginRight: iconMargin }}
              />
            ),
            text: "Access to recording studios",
            important: true,
          },
          {
            icon: (
              <CheckCircle
                fontSize={iconSize}
                style={{ color: subscriptionColors.primaryColor, marginRight: iconMargin }}
              />
            ),
            text: "Priority booking slots",
            important: false,
          },
          {
            icon: (
              <CheckCircle
                fontSize={iconSize}
                style={{ color: subscriptionColors.primaryColor, marginRight: iconMargin }}
              />
            ),
            text: "Basic equipment included",
            important: false,
          },
        ];
      case "premium":
        return [
          ...baseFeatures,
          {
            icon: (
              <MusicNote
                fontSize={iconSize}
                style={{ color: subscriptionColors.primaryColor, marginRight: iconMargin }}
              />
            ),
            text: "Access to all jamrooms",
            important: true,
          },
          {
            icon: (
              <Mic
                fontSize={iconSize}
                style={{ color: subscriptionColors.primaryColor, marginRight: iconMargin }}
              />
            ),
            text: "Access to premium studios",
            important: true,
          },
          {
            icon: (
              <CheckCircle
                fontSize={iconSize}
                style={{ color: subscriptionColors.primaryColor, marginRight: iconMargin }}
              />
            ),
            text: "Priority booking slots",
            important: false,
          },
          {
            icon: (
              <CheckCircle
                fontSize={iconSize}
                style={{ color: subscriptionColors.primaryColor, marginRight: iconMargin }}
              />
            ),
            text: "All equipment included",
            important: true,
          },
          {
            icon: (
              <CheckCircle
                fontSize={iconSize}
                style={{ color: subscriptionColors.primaryColor, marginRight: iconMargin }}
              />
            ),
            text: "Sound engineer assistance",
            important: true,
          },
        ];
      default:
        return baseFeatures;
    }
  };

  const features = getFeatures(tier);

  // On mobile, limit the number of features shown initially in basic and pro tiers
  const visibleFeatures = isMobile && tier !== "premium" 
    ? features.filter(f => f.important)
    : features;

  return (
    <Box mb={isMobile ? 2 : 3} className="feature-list">
      {visibleFeatures.map((feature, index) => (
        <FeatureItem key={index} isMobile={isMobile}>
          <FeatureIcon isMobile={isMobile}>
            {feature.icon}
          </FeatureIcon>
          <FeatureText 
            variant="body2" 
            isMobile={isMobile}
            sx={{ 
              fontWeight: feature.important ? 500 : 400,
            }}
          >
            {feature.text}
          </FeatureText>
        </FeatureItem>
      ))}
      
      {/* Only on mobile, show a "more features" indicator if we've hidden some */}
      {isMobile && tier !== "premium" && features.length > visibleFeatures.length && (
        <Typography 
          variant="caption" 
          sx={{ 
            color: subscriptionColors.accentColor, 
            display: 'block',
            textAlign: 'center',
            mt: 1,
            fontStyle: 'italic'
          }}
        >
          +{features.length - visibleFeatures.length} more features
        </Typography>
      )}
    </Box>
  );
};

export default FeatureList;