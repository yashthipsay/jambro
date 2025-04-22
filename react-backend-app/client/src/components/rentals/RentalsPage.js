import React from "react";
import { Box, Typography, useMediaQuery, Paper, Button } from "@mui/material";
import {
  Music,
  Calendar,
  ShieldCheck,
  Clock,
  Truck,
  Package,
} from "lucide-react";

// Match the color scheme used in the subscription components
const rentalColors = {
  primaryColor: "#6434fc",
  secondaryColor: "#a085eb",
  accentColor: "#8059f7",
  backgroundColor: "#f8f6ff",
  cardBackground: "#ffffff",
  textColor: "#352c63",
  lightTextColor: "#dcd5ff",
};

// RentalsPage with "Coming Soon" message
const RentalsPage = () => {
  const isMobile = useMediaQuery("(max-width:600px)");

  return (
    <Box
      sx={{
        backgroundColor: rentalColors.backgroundColor,
        minHeight: "100vh",
        backgroundImage: `radial-gradient(circle at 50% 0%, #e9e4ff 0%, ${rentalColors.backgroundColor} 70%)`,
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
            color: rentalColors.textColor,
            fontWeight: 700,
            mb: 2,
            fontSize: isMobile ? "2.5rem" : "3.5rem",
            textShadow: "0 2px 4px rgba(0,0,0,0.1)",
            background: `linear-gradient(135deg, ${rentalColors.primaryColor}, ${rentalColors.accentColor})`,
            backgroundClip: "text",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          Equipment Rentals
        </Typography>

        <Typography
          variant="h5"
          component="div"
          sx={{
            color: rentalColors.textColor,
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
            border: `1px solid ${rentalColors.secondaryColor}20`,
            boxShadow: `0 10px 40px -10px ${rentalColors.accentColor}40`,
          }}
        >
          <Typography
            variant="h4"
            sx={{
              color: rentalColors.textColor,
              fontWeight: 600,
              mb: 3,
            }}
          >
            Rent Premium Music Equipment
          </Typography>

          <Typography
            variant="body1"
            sx={{ mb: 4, fontSize: "1.1rem", color: rentalColors.textColor }}
          >
            We're excited to announce that Equipment Rentals will be available
            soon! Our rental service will give you access to high-quality
            instruments and audio equipment without the hefty price tag of
            ownership.
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
              <Music
                size={48}
                color={rentalColors.primaryColor}
                strokeWidth={1.5}
              />
              <Typography
                variant="h6"
                sx={{ my: 2, fontWeight: 600, color: rentalColors.textColor }}
              >
                Premium Instruments
              </Typography>
              <Typography
                variant="body2"
                color="text.secondary"
                textAlign="center"
              >
                Access professional-grade guitars, drums, keyboards, and more
                without the commitment of purchasing.
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
              <Calendar
                size={48}
                color={rentalColors.primaryColor}
                strokeWidth={1.5}
              />
              <Typography
                variant="h6"
                sx={{ my: 2, fontWeight: 600, color: rentalColors.textColor }}
              >
                Flexible Duration
              </Typography>
              <Typography
                variant="body2"
                color="text.secondary"
                textAlign="center"
              >
                Rent equipment for as little as a day or as long as a month,
                with competitive rates for longer rentals.
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
              <Truck
                size={48}
                color={rentalColors.primaryColor}
                strokeWidth={1.5}
              />
              <Typography
                variant="h6"
                sx={{ my: 2, fontWeight: 600, color: rentalColors.textColor }}
              >
                Delivery Options
              </Typography>
              <Typography
                variant="body2"
                color="text.secondary"
                textAlign="center"
              >
                Choose between convenient pickup at partner locations or
                doorstep delivery for a seamless experience.
              </Typography>
            </Box>
          </Box>

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
              <ShieldCheck
                size={48}
                color={rentalColors.primaryColor}
                strokeWidth={1.5}
              />
              <Typography
                variant="h6"
                sx={{ my: 2, fontWeight: 600, color: rentalColors.textColor }}
              >
                Insurance Included
              </Typography>
              <Typography
                variant="body2"
                color="text.secondary"
                textAlign="center"
              >
                Every rental includes basic insurance coverage, with options for
                premium protection for total peace of mind.
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
              <Package
                size={48}
                color={rentalColors.primaryColor}
                strokeWidth={1.5}
              />
              <Typography
                variant="h6"
                sx={{ my: 2, fontWeight: 600, color: rentalColors.textColor }}
              >
                Equipment Packages
              </Typography>
              <Typography
                variant="body2"
                color="text.secondary"
                textAlign="center"
              >
                Choose from curated packages for specific needs like recording,
                live performance, or practice sessions.
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
                color={rentalColors.primaryColor}
                strokeWidth={1.5}
              />
              <Typography
                variant="h6"
                sx={{ my: 2, fontWeight: 600, color: rentalColors.textColor }}
              >
                Try Before You Buy
              </Typography>
              <Typography
                variant="body2"
                color="text.secondary"
                textAlign="center"
              >
                Test out equipment before making a purchase commitment, with
                rental fees credited toward purchase.
              </Typography>
            </Box>
          </Box>

          <Typography
            variant="body1"
            sx={{ mb: 4, fontWeight: 500, color: rentalColors.textColor }}
          >
            The Equipment Rentals service will include everything from guitars
            and amplifiers to professional microphones and recording equipment,
            all maintained to the highest standards.
          </Typography>

          <Button
            variant="contained"
            disabled
            sx={{
              backgroundColor: rentalColors.primaryColor,
              py: 1.5,
              px: 4,
              fontSize: "1.1rem",
              "&:hover": {
                backgroundColor: rentalColors.accentColor,
              },
              "&.Mui-disabled": {
                backgroundColor: rentalColors.secondaryColor,
                color: "white",
                opacity: 0.7,
              },
            }}
          >
            Coming Soon
          </Button>
        </Paper>

        {/* FAQ Section */}
        <Paper
          elevation={4}
          sx={{
            p: isMobile ? 3 : 5,
            background: "rgba(255, 255, 255, 0.9)",
            borderRadius: 4,
            maxWidth: 900,
            mx: "auto",
            border: `1px solid ${rentalColors.secondaryColor}20`,
          }}
        >
          <Typography
            variant="h4"
            sx={{
              color: rentalColors.textColor,
              fontWeight: 600,
              mb: 4,
              textAlign: "center",
            }}
          >
            Rental FAQs
          </Typography>

          <Box sx={{ textAlign: "left", maxWidth: 800, mx: "auto" }}>
            <Box sx={{ mb: 4 }}>
              <Typography
                variant="h6"
                sx={{ fontWeight: 600, mb: 1, color: rentalColors.textColor }}
              >
                What types of equipment will be available?
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Our rental inventory will include guitars, basses, drums,
                keyboards, DJ equipment, microphones, amplifiers, and recording
                gear from top brands in the industry.
              </Typography>
            </Box>

            <Box sx={{ mb: 4 }}>
              <Typography
                variant="h6"
                sx={{ fontWeight: 600, mb: 1, color: rentalColors.textColor }}
              >
                How will the rental process work?
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Simply browse our catalog, select your equipment, choose your
                rental duration, and complete checkout. You'll be able to pick
                up from partner locations or select delivery to your address.
              </Typography>
            </Box>

            <Box sx={{ mb: 4 }}>
              <Typography
                variant="h6"
                sx={{ fontWeight: 600, mb: 1, color: rentalColors.textColor }}
              >
                Will deposits be required?
              </Typography>
              <Typography variant="body1" color="text.secondary">
                A security deposit will be required for most equipment rentals.
                The deposit amount will depend on the value of the rented items
                and will be fully refunded when equipment is returned in good
                condition.
              </Typography>
            </Box>

            <Box sx={{ mb: 4 }}>
              <Typography
                variant="h6"
                sx={{ fontWeight: 600, mb: 1, color: rentalColors.textColor }}
              >
                What if something breaks during my rental?
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Basic insurance is included with every rental to cover normal
                wear and tear. Optional premium insurance will be available to
                cover accidents and more extensive damage.
              </Typography>
            </Box>
          </Box>
        </Paper>
      </Box>
    </Box>
  );
};

export default RentalsPage;
