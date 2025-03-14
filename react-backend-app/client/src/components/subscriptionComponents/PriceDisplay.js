import React from "react";
import { Typography, Box } from "@mui/material";

const PriceDisplay = ({ price, frequency, size = "large", color }) => {
  // Ensure price is a number or default to 0
  const safePrice = typeof price === "number" ? price : 0;
  
  // Format price with thousand separators
  const formattedPrice = safePrice.toLocaleString("en-IN");
  
  // Set size based on prop
  const priceSize = size === "large" ? "h3" : "h5";
  const rupeeSize = size === "large" ? "h5" : "subtitle1";
  
  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "baseline",
        justifyContent: "center",
        color: color || "inherit",
      }}
    >
      <Typography
        variant={rupeeSize}
        component="span"
        sx={{ fontWeight: 500, mr: 0.5 }}
      >
        ₹
      </Typography>
      <Typography
        variant={priceSize}
        component="span"
        sx={{ fontWeight: 700, letterSpacing: "-0.5px" }}
      >
        {formattedPrice}
      </Typography>
      <Typography
        variant="body2"
        component="span"
        sx={{ ml: 1, opacity: 0.7, fontWeight: 500 }}
      >
        /{frequency === "monthly" ? "mo" : frequency === "half_yearly" ? "6mo" : "yr"}
      </Typography>
    </Box>
  );
};

export default PriceDisplay;