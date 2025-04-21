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
import GroupSetup from "./components/subscriptionComponents/GroupSetup";
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
  Tooltip,
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
  Users,
} from "lucide-react";
import PastBookings from "./components/PastBookings";
import { useSubscription } from "./context/SubscriptionContext";
import { SubscriptionProvider } from "./context/SubscriptionContext";
import GroupSelectionModal from "./components/subscriptionComponents/GroupSelectionModal";
import OneSignal from "react-onesignal";

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
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [archivedGroups, setArchivedGroups] = useState([]);
  const [isLoadingGroups, setIsLoadingGroups] = useState(false);
  const open = Boolean(anchorEl);
  const navigate = useNavigate();

  const {
    subscription,
    showCancelDialog,
    setShowCancelDialog,
    cancelSubscription,
    updateSubscription,
  } = useSubscription();

  const menuItems = [
    { text: "Past Bookings", icon: <History />, path: "/bookings" },
    { text: "About Us", icon: <Info />, path: "/about" },
    { text: "Contact", icon: <Mail />, path: "/contact" },
    { text: "Support", icon: <Phone />, path: "/support" },
    { text: "My Groups", path: "/my-groups", icon: <Users size={20} /> },
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

  // Add a function to fetch archived groups
  const fetchArchivedGroups = async () => {
    if (!user) return;

    try {
      setIsLoadingGroups(true);

      // First get the database userId
      const userResponse = await fetch(
        "https://api.vision.gigsaw.co.in/api/users",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email: user.email }),
        }
      );

      const userData = await userResponse.json();
      if (!userData.success) {
        throw new Error("Failed to get user details");
      }

      const userId = userData.data._id;

      // Fetch archived groups
      const response = await fetch(
        `https://api.vision.gigsaw.co.in/api/groups/archived/${userId}`
      );

      const data = await response.json();
      if (data.success) {
        setArchivedGroups(data.data);
      }
    } catch (error) {
      console.error("Error fetching archived groups:", error);
    } finally {
      setIsLoadingGroups(false);
    }
  };

  const handleMenuClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  useEffect(() => {
    // Function to initialize OneSignal
    const initializeOneSignal = async () => {
      if (!isAuthenticated || !user) return;
      
      try {
        // Initialize OneSignal with your app ID
        await OneSignal.init({
          appId: 'b9e55a3c-883e-4be8-b345-b5d771d75c62',
          allowLocalhostAsSecureOrigin: true,
          // Configure for slide prompt instead of notification button
          notifyButton: {
            enable: false, // Disable the bell icon
          },
          // Use slide prompt configuration
          slidedown: {
            prompts: [
              {
                type: "push", // This configures the push notification slidedown
                autoPrompt: true,
                text: {
                  actionMessage: "Would you like to receive notifications about your bookings?",
                  acceptButton: "Allow",
                  cancelButton: "Maybe later"
                },
                delay: {
                  pageViews: 1,
                  timeDelay: 20
                }
              }
            ]
          }
        });
        
  
        // Check if the user is already subscribed
        const isPushSupported =  OneSignal.Notifications.isPushSupported();
        if (isPushSupported) {
          const isSubscribed =  OneSignal.Notifications.permission === true;
          
          // Only show prompt if not already subscribed
          if (!isSubscribed) {
            await OneSignal.Notifications.requestPermission();
          }
        }
  
        /* 
        // Get OneSignal user ID after subscription - COMMENTED OUT FOR LATER USE
        const oneSignalId = OneSignal.User?.PushSubscription?.id;
        if (oneSignalId) {
          console.log('OneSignal user ID found:', oneSignalId);
          
          // Update backend with OneSignal ID
          try {
            const response = await fetch(
              "https://api.vision.gigsaw.co.in/api/users/update-onesignal",
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  email: user.email,
                  oneSignalUserId: oneSignalId,
                }),
              }
            );
  
            const data = await response.json();
            if (data.success) {
              console.log('OneSignal ID updated successfully');
            } else {
              console.error('Failed to update OneSignal ID:', data.message);
            }
          } catch (error) {
            console.error('Error updating OneSignal ID:', error);
          }
        }
        */
  
        /*
        // Set up notification click handler - COMMENTED OUT FOR LATER USE
        OneSignal.Notifications.addEventListener('click', (event) => {
          console.log('Notification clicked:', event);
          const bookingId = event?.notification?.additionalData?.bookingId;
          if (bookingId) {
            // Navigate to booking details
            navigate(`/bookings?bookingId=${bookingId}`);
          }
        });
        */
      } catch (error) {
        console.error('Error initializing OneSignal:', error);
      }
    };
  
    // Initialize OneSignal when user logs in
    if (isAuthenticated && user) {
      initializeOneSignal();
    }
  
    // Cleanup function
    return () => {
      /* 
      // COMMENTED OUT FOR LATER USE
      if (OneSignal?.Notifications) {
        OneSignal.Notifications.removeEventListener('click');
      }
      */
    };
  }, [isAuthenticated, user]); // Removed navigate from dependencies since it's no longer used

  useEffect(() => {
    const registerUser = async () => {
      if (isAuthenticated && user) {
        try {
          const response = await fetch(
            "https://api.vision.gigsaw.co.in/api/users/register",
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                name: user.name || "NA",
                email: user.email,
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

  const fetchActiveGroup = async () => {
    if (!subscription?._id) return;
    try {
      const response = await fetch(
        `https://api.vision.gigsaw.co.in/api/groups/active/${subscription._id}`
      );
      const data = await response.json();
      if (data.success) {
        // Option 1: Update your subscription context to add group details
        updateSubscription((prev) => ({
          ...prev,
          groupId: data.data.groupId,
          groupName: data.data.groupName,
        }));
      }
    } catch (error) {
      console.error("Error fetching active group:", error);
    }
  };

  useEffect(() => {
    if (subscription && subscription._id) {
      fetchActiveGroup();
    }
  }, [subscription]);

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
              {subscription && subscription.groupId ? (
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<Users />}
                  onClick={() => navigate("/my-groups")}
                >
                  {subscription.groupName
                    ? `Group: ${subscription.groupName}`
                    : "Group Active"}
                </Button>
              ) : subscription ? (
                <Button
                  fullWidth
                  variant="outlined"
                  onClick={() => setShowGroupModal(true)}
                  startIcon={<Users />}
                >
                  Create/Select Group
                </Button>
              ) : null}
              <GroupSelectionModal
                open={showGroupModal}
                onClose={() => setShowGroupModal(false)}
                archivedGroups={archivedGroups}
                isLoading={isLoadingGroups}
                onReload={fetchArchivedGroups}
              />
              <div className="flex items-center justify-between gap-2 mb-4">
                <div className="flex items-center gap-2">
                  <Star className="w-5 h-5 text-indigo-600" />
                  <Typography
                    variant="h6"
                    className="font-semibold text-indigo-600"
                  >
                    {subscription.tier && typeof subscription.tier === "string"
                      ? subscription.tier.charAt(0).toUpperCase() +
                        subscription.tier.slice(1)
                      : "No Plan"}{" "}
                    {subscription.type === "GROUP" ? "Group" : "Individual"}{" "}
                    Plan
                  </Typography>
                </div>
                {subscription.type === "GROUP" &&
                  subscription.memberEmails?.length > 0 && (
                    <Tooltip
                      title={
                        <Box sx={{ p: 1, minWidth: 200 }}>
                          <Typography
                            variant="subtitle2"
                            sx={{
                              borderBottom: "1px solid rgba(255,255,255,0.1)",
                              pb: 1,
                              mb: 1,
                            }}
                          >
                            Group Members
                          </Typography>
                          <List dense sx={{ p: 0 }}>
                            {subscription.memberEmails.map((email) => (
                              <ListItem key={email} sx={{ py: 0.5, px: 0 }}>
                                <ListItemText
                                  primary={email}
                                  primaryTypographyProps={{
                                    variant: "caption",
                                    sx: { color: "white" },
                                  }}
                                />
                              </ListItem>
                            ))}
                          </List>
                        </Box>
                      }
                      arrow
                      placement="right"
                      sx={{
                        bgcolor: "rgba(0,0,0,0.9)",
                        "& .MuiTooltip-arrow": {
                          color: "rgba(0,0,0,0.9)",
                        },
                      }}
                    >
                      <div className="flex items-center gap-1 text-indigo-600 cursor-pointer hover:text-indigo-700">
                        <Typography variant="caption" className="font-medium">
                          {subscription.memberEmails.length} member
                          {subscription.memberEmails.length !== 1 ? "s" : ""}
                        </Typography>
                        <Info size={14} />
                      </div>
                    </Tooltip>
                  )}
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
                <Avatar src={user.picture} alt={user.name} className="w-8 h-8">
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
        <Route path="/group-setup" element={<GroupSetup />} />
        <Route path="/my-groups" element={<GroupSetup />} />
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
