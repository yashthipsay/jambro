import React from "react";
import { Box, Typography } from "@mui/material";
import { styled } from "@mui/material/styles";
import { subscriptionColors } from "./SubscriptionsPage";

const PriceBadge = styled(Box)(({ theme }) => ({
  backgroundColor: subscriptionColors.primaryColor,
  color: "white",
  padding: "6px 16px",
  borderRadius: 20,
  fontWeight: 600,
  display: "inline-flex",
  alignItems: "center",
  marginTop: 16,
  marginBottom: 16,
  boxShadow: "0 4px 12px rgba(100, 52, 252, 0.3)",
}));

const OldPrice = styled(Typography)(({ theme }) => ({
  textDecoration: "line-through",
  color: "#777",
  display: "inline",
  marginRight: 8,
}));

const PriceDisplay = ({ pricing }) => {
  return (
    <PriceBadge>
      {pricing.discount > 0 && (
        <OldPrice variant="body1">
          ₹{pricing.basePrice.toLocaleString()}
        </OldPrice>
      )}
      <Typography variant="h5" sx={{ fontWeight: 700 }}>
        ₹{pricing.discountedPrice.toLocaleString()}
      </Typography>
      <Typography variant="body2" sx={{ ml: 1, opacity: 0.8 }}>
        /month
      </Typography>
    </PriceBadge>
  );
};

export default PriceDisplay;