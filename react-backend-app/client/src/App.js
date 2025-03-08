"use client";

import { useEffect, useState, useMemo } from "react";
import CancelSubscriptionDialog from "./components/dialogs/CancelSubscriptionDialog";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  useNavigate,
} from "react-router-dom";
import { useAuth0 } from "@auth0/auth0-react";
import JamRoomFinder from "./JamRoomFinder";
import JamRoomDetails from "./components/JamRoomDetails";
import Booking from "./components/Booking";
import FinalReview from "./components/FinalReview";
import BookingConfirmation from "./components/BookingConfirmation";
import SubscriptionsPage from "./components/subscriptionComponents/SubscriptionsPage";
import {
  Button,
  AppBar,
  Toolbar,
  Typography,
  Avatar,
  Menu,
  MenuItem,
  IconButton,
  CircularProgress,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Box,
  styled,
  DialogActions,
  DialogContent,
  DialogTitle,
  Dialog,
} from "@mui/material";
import {
  History,
  Info,
  Gavel,
  LogOut,
  User,
  Mail,
  Phone,
  Shield,
  Menu as MenuIcon,
  CreditCard,
  Star,
  ArrowUpCircle,
  XCircle,
} from "lucide-react";
import PastBookings from "./components/PastBookings";
import { useSubscription } from "./context/SubscriptionContext";
import { SubscriptionProvider } from "./context/SubscriptionContext";

// Add this new styled component for the subscription card
const SubscriptionCard = styled(Box)(({ theme }) => ({
  margin: "16px",
  padding: "16px",
  borderRadius: "12px",
  background:
    "linear-gradient(135deg, rgba(100, 52, 252, 0.1) 0%, rgba(128, 89, 247, 0.1) 100%)",
  border: "1px solid rgba(100, 52, 252, 0.2)",
}));

function AppContent() {
  const {
    loginWithRedirect,
    logout,
    isAuthenticated,
    isLoading,
    user,
    getIdTokenClaims,
  } = useAuth0();
  const [anchorEl, setAnchorEl] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const open = Boolean(anchorEl);
  const navigate = useNavigate();
  
  const {
    subscription,
    showCancelDialog,
    setShowCancelDialog,
    cancelSubscription,
  } = useSubscription();

  // Add this mock subscription data (temporary until backend integration)
  const mockSubscription = useMemo(
    () => ({
      tier: "pro",
      hours: 30,
      access: "both",
      frequency: "monthly",
      nextBilling: new Date(
        Date.now() + 30 * 24 * 60 * 60 * 1000
      ).toLocaleDateString(),
    }),
    []
  );


  const menuItems = [
    { text: "Past Bookings", icon: <History />, path: "/bookings" },
    { text: "About Us", icon: <Info />, path: "/about" },
    { text: "Contact", icon: <Mail />, path: "/contact" },
    { text: "Support", icon: <Phone />, path: "/support" },
  ];

  const footerItems = [
    { text: "Terms & Conditions", icon: <Gavel />, path: "/terms" },
    { text: "Privacy Policy", icon: <Shield />, path: "/privacy" },
  ];

  const toggleDrawer = (open) => (event) => {
    if (
      event.type === "keydown" &&
      (event.key === "Tab" || event.key === "Shift")
    ) {
      return;
    }
    setDrawerOpen(open);
  };

  const handleMenuClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  useEffect(() => {
    const registerUser = async () => {
      if (isAuthenticated && user) {
        try {
          const response = await fetch(
            "https://gigsaw.onrender.com/api/users/register",
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                name: user.name || "NA",
                email: user.email,
                mobileNumber: user.phone_number || "",
              }),
            }
          );

          const data = await response.json();
          if (!data.success) {
            console.error("Error registering user:", data.message);
          }
        } catch (error) {
          console.error("Error registering user:", error);
        }
      }
    };

    registerUser();
  }, [isAuthenticated, user]);

  const handleLogin = () => {
    loginWithRedirect();
  };

  const drawerContent = () => (
    <Box
      sx={{ width: 280 }}
      role="presentation"
      onClick={toggleDrawer(false)}
      onKeyDown={toggleDrawer(false)}
    >
      {isAuthenticated && (
        <Box className="p-4 bg-gradient-to-r from-indigo-500 to-purple-600">
          <div className="flex items-center space-x-4">
            <Avatar
              src={user?.picture}
              alt={user?.name}
              className="w-12 h-12 border-2 border-white"
            />
            <div className="flex flex-col">
              <Typography
                variant="subtitle1"
                className="text-white font-semibold"
              >
                {user?.name}
              </Typography>
              <Typography variant="caption" className="text-white/80">
                {user?.email}
              </Typography>
            </div>
          </div>
        </Box>
      )}

      {/* Add Subscription Section */}
      {isAuthenticated && (
        <SubscriptionCard className="subscription-card">
          <div className="flex items-center justify-between mb-3">
            <Typography
              variant="subtitle2"
              className="text-gray-600 font-medium"
            >
              Current Plan
            </Typography>
            <CreditCard className="w-4 h-4 text-indigo-600" />
          </div>

          {subscription ? (
            <>
              <div className="flex items-center gap-2 mb-4">
                <Star className="w-5 h-5 text-indigo-600" />
                <Typography
                  variant="h6"
                  className="font-semibold text-indigo-600"
                >
                  {subscription.tier.charAt(0).toUpperCase() +
                    subscription.tier.slice(1)}{" "}
                  Plan
                </Typography>
              </div>

              <div className="space-y-2 mb-4">
                <Typography variant="body2" className="text-gray-600">
                  • {subscription.hours} hours per month
                </Typography>
                <Typography variant="body2" className="text-gray-600">
                  •{" "}
                  {subscription.access === "both"
                    ? "Jamrooms & Studios"
                    : subscription.access.charAt(0).toUpperCase() +
                      subscription.access.slice(1)}
                </Typography>
                <Typography variant="body2" className="text-gray-600">
                  • Next billing: {subscription.nextBilling}
                </Typography>
              </div>

              <div className="space-y-2">
                <Button
                  fullWidth
                  variant="outlined"
                  onClick={(e) => {
                    e.stopPropagation();
                    setDrawerOpen(false);
                    navigate("/subscriptions");
                  }}
                  startIcon={<ArrowUpCircle />}
                  className="text-indigo-600 border-indigo-600 hover:bg-indigo-50"
                  size="small"
                >
                  Change Plan
                </Button>

                <Button
                  fullWidth
                  variant="outlined"
                  color="error"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowCancelDialog(true);
                  }}
                  startIcon={<XCircle />}
                  size="small"
                  className="border-red-500 text-red-500 hover:bg-red-50"
                >
                  Cancel Plan
                </Button>
              </div>
            </>
          ) : (
            <div className="text-center py-2">
              <Typography variant="body2" className="text-gray-500 mb-3">
                No active subscription
              </Typography>
              <Button
                variant="contained"
                onClick={(e) => {
                  e.stopPropagation();
                  setDrawerOpen(false);
                  navigate("/subscriptions");
                }}
                className="bg-indigo-600 hover:bg-indigo-700 text-white"
                size="small"
              >
                View Plans
              </Button>
            </div>
          )}
        </SubscriptionCard>
      )}

      <List>
        {menuItems.map((item) => (
          <ListItem
            button
            key={item.text}
            onClick={() => navigate(item.path)}
            className="hover:bg-gray-100"
          >
            <ListItemIcon className="text-gray-600">{item.icon}</ListItemIcon>
            <ListItemText primary={item.text} />
          </ListItem>
        ))}
      </List>

      <Divider className="mt-auto" />

      <List>
        {footerItems.map((item) => (
          <ListItem
            button
            key={item.text}
            onClick={() => navigate(item.path)}
            className="hover:bg-gray-100"
          >
            <ListItemIcon className="text-gray-600">{item.icon}</ListItemIcon>
            <ListItemText
              primary={item.text}
              primaryTypographyProps={{
                variant: "body2",
                className: "text-gray-600",
              }}
            />
          </ListItem>
        ))}

        {isAuthenticated && (
          <ListItem
            button
            onClick={() => logout({ returnTo: window.location.origin })}
            className="hover:bg-red-50"
          >
            <ListItemIcon className="text-red-600">
              <LogOut />
            </ListItemIcon>
            <ListItemText primary="Logout" className="text-red-600" />
          </ListItem>
        )}
      </List>
    </Box>
  );

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <CircularProgress color="primary" />
      </div>
    );
  }

  return (
    <>
        <AppBar
          position="static"
          color="default"
          elevation={1}
          className="bg-white"
        >
          <Toolbar className="justify-between">
            <div className="flex items-center gap-4">
              {isAuthenticated && (
                <IconButton
                  edge="start"
                  color="inherit"
                  aria-label="menu"
                  onClick={toggleDrawer(true)}
                >
                  <MenuIcon className="h-6 w-6" />
                </IconButton>
              )}
              <img
                src="/gigsaw_ss.png"
                alt="JamRoom Logo"
                className="h-8 object-contain cursor-pointer rounded-lg transition-transform hover:scale-105"
                onClick={() => (window.location.href = "/")}
              />
            </div>

            {isAuthenticated && user ? (
              <div>
                <IconButton
                  onClick={handleMenuClick}
                  size="small"
                  aria-controls={open ? "account-menu" : undefined}
                  aria-haspopup="true"
                  aria-expanded={open ? "true" : undefined}
                >
                  <Avatar
                    src={user.picture}
                    alt={user.name}
                    className="w-8 h-8"
                  >
                    {user.name?.charAt(0) || "U"}
                  </Avatar>
                </IconButton>
                <Menu
                  id="account-menu"
                  anchorEl={anchorEl}
                  open={open}
                  onClose={handleMenuClose}
                  transformOrigin={{ horizontal: "right", vertical: "top" }}
                  anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
                >
                  <MenuItem disabled className="flex items-center gap-2">
                    <User className="w-4 h-4" />
                    <div className="flex flex-col">
                      <Typography variant="body2" className="font-medium">
                        {user.name}
                      </Typography>
                      <Typography variant="caption" className="text-gray-500">
                        {user.email}
                      </Typography>
                    </div>
                  </MenuItem>
                  <MenuItem
                    onClick={() => {
                      handleMenuClose();
                      logout({ returnTo: window.location.origin });
                    }}
                    className="text-red-600"
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Logout
                  </MenuItem>
                </Menu>
              </div>
            ) : (
              <Button
                variant="contained"
                color="primary"
                onClick={handleLogin}
                size="small"
              >
                Login
              </Button>
            )}
          </Toolbar>
        </AppBar>
        {isAuthenticated && (
          <Drawer anchor="left" open={drawerOpen} onClose={toggleDrawer(false)}>
            {drawerContent()}
          </Drawer>
        )}

        <CancelSubscriptionDialog
          open={showCancelDialog}
          onClose={() => setShowCancelDialog(false)}
          onConfirm={cancelSubscription}
          subscriptionDetails={subscription}
        />
        <Routes>
          <Route path="/" element={<JamRoomFinder />} />
          <Route path="/jam-room/:id" element={<JamRoomDetails />} />
          <Route path="/booking/:id" element={<Booking />} />
          <Route path="/final-review" element={<FinalReview />} />
          <Route path="/confirmation/:id" element={<BookingConfirmation />} />
          <Route path="/bookings" element={<PastBookings />} />

          {/* Subscription Routes */}
          <Route path="/subscriptions" element={<SubscriptionsPage />} />
        </Routes>
    </>
  );
}

function App() {
  return (
    <SubscriptionProvider>
      <AppContent />
    </SubscriptionProvider>
  );
}

export default App;
