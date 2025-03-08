import React from "react";
import { Box, Typography, Grid } from "@mui/material";
import { subscriptionColors } from "./SubscriptionsPage";

const faqItems = [
  {
    question: "What is included in the Gigsaw Pass?",
    answer:
      "All Gigsaw Pass plans include selected hours of jamroom and/or studio access per month, along with a Spotify Premium subscription. The specific amenities vary by tier.",
  },
  {
    question: "Can I upgrade my plan?",
    answer:
      "Yes, you can upgrade your plan at any time. The price difference will be prorated for the remainder of your billing period.",
  },
  {
    question: "How do I book sessions with my Pass?",
    answer:
      "Once subscribed, you can book sessions through the GigSaw app. Pass subscribers get priority booking access and can reserve slots up to 30 days in advance.",
  },
  {
    question: "What if I don't use all my hours?",
    answer:
      "Hours do not roll over to the next month. We recommend selecting a plan that matches your expected usage.",
  },
];

const SubscriptionFAQ = () => {
  return (
    <Box mt={10} textAlign="center">
      <Typography
        variant="h4"
        sx={{ color: subscriptionColors.textColor, fontWeight: 700, mb: 6 }}
      >
        Frequently Asked Questions
      </Typography>

      <Grid container spacing={4}>
        {faqItems.map((faq, index) => (
          <Grid item xs={12} md={6} key={index}>
            <Box textAlign="left" mb={4}>
              <Typography
                variant="h6"
                sx={{ color: subscriptionColors.textColor, fontWeight: 600, mb: 1 }}
              >
                {faq.question}
              </Typography>
              <Typography
                variant="body2"
                sx={{ color: subscriptionColors.textColor, opacity: 0.8 }}
              >
                {faq.answer}
              </Typography>
            </Box>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default SubscriptionFAQ;