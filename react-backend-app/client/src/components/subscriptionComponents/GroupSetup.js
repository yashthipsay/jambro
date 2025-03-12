import React, { useEffect, useState } from "react";
import {
  Box,
  Container,
  Typography,
  TextField,
  Button,
  IconButton,
  Tooltip,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Alert,
} from "@mui/material";
import { useLocation, useNavigate } from "react-router-dom";
import { X, Info } from "lucide-react";
import { useSubscription } from "../../context/SubscriptionContext";

const GroupSetup = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { subscription, updateSubscription } = useSubscription();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");

  // // Prevent direct access to group setup if subscription exists with members
  // useEffect(() => {
  //   if (
  //     subscription?.memberEmails?.length > 0 &&
  //     subscription.status !== "CANCELLED"
  //   ) {
  //     navigate("/subscriptions");
  //   }
  // }, [subscription, navigate]);

  // Member emails state (from subscription or empty array)
  const [memberEmails, setMemberEmails] = useState(
    subscription?.memberEmails || []
  );

  const validateEmail = (email) => {
    return String(email)
      .toLowerCase()
      .match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
  };

  const handleAddMember = () => {
    if (!validateEmail(email)) {
      setError("Please enter a valid email address");
      return;
    }

    if (memberEmails.includes(email)) {
      setError("This email is already added");
      return;
    }

    if (memberEmails.length >= 5) {
      setError("Maximum 5 members allowed");
      return;
    }

    const newMemberEmails = [...memberEmails, email];
    setMemberEmails(newMemberEmails);

    // Update subscription context with new member
    updateSubscription({
      ...subscription,
      type: "GROUP", // Ensure type is set
      memberEmails: newMemberEmails,
      status: subscription?.status || "ACTIVE", // Ensure status is set
    });

    setEmail("");
    setError("");
  };

  const handleConfirmGroup = () => {
    // Update subscription one final time before navigating
    updateSubscription({
      ...subscription,
      type: "GROUP",
      memberEmails: memberEmails,
      status: "ACTIVE",
    });
    navigate("/subscriptions");
  };

  const handleRemoveMember = (emailToRemove) => {
    const updatedEmails = memberEmails.filter(
      (email) => email !== emailToRemove
    );
    setMemberEmails(updatedEmails);

    // Update subscription context
    updateSubscription({
      ...subscription,
      memberEmails: updatedEmails,
    });
  };

  return (
    <Container maxWidth="sm" sx={{ py: 4 }}>
      <Box sx={{ mb: 4, textAlign: "center" }}>
        <Typography variant="h4" gutterBottom>
          Group Setup
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Add up to 5 members to your group subscription
        </Typography>
      </Box>

      {subscription ? (
        <Box
          sx={{
            mb: 4,
            p: 3,
            bgcolor: "background.paper",
            borderRadius: 2,
            boxShadow: 1,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
            <Typography variant="h6">
              {subscription.tier.charAt(0).toUpperCase() +
                subscription.tier.slice(1)}{" "}
              Group Plan
            </Typography>
            <Tooltip title={`${5 - memberEmails.length} spots remaining`}>
              <IconButton size="small">
                <Info size={18} />
              </IconButton>
            </Tooltip>
          </Box>
          <Typography color="text.secondary">
            Hours: {subscription.hours} per month
          </Typography>
          <Typography color="text.secondary">
            Next Billing: {subscription.nextBilling}
          </Typography>
        </Box>
      ) : (
        <Typography>No subscription data available.</Typography>
      )}

      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: "flex", gap: 1, mb: 1 }}>
          <TextField
            fullWidth
            label="Member Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            error={!!error}
            helperText={error}
            placeholder="Enter member email address"
            variant="outlined"
            size="medium"
          />
          <Button
            variant="contained"
            onClick={handleAddMember}
            disabled={memberEmails.length >= 5}
            sx={{ minWidth: "120px" }}
          >
            Add Member
          </Button>
        </Box>

        {memberEmails.length >= 5 && (
          <Alert severity="info" sx={{ mt: 2 }}>
            Maximum number of members reached (5)
          </Alert>
        )}
      </Box>

      {memberEmails.length > 0 && (
        <List sx={{ mb: 4, bgcolor: "background.paper", borderRadius: 2 }}>
          {memberEmails.map((memberEmail) => (
            <ListItem key={memberEmail} divider>
              <ListItemText primary={memberEmail} />
              <ListItemSecondaryAction>
                <IconButton
                  edge="end"
                  onClick={() => handleRemoveMember(memberEmail)}
                  size="small"
                >
                  <X size={18} />
                </IconButton>
              </ListItemSecondaryAction>
            </ListItem>
          ))}
        </List>
      )}

      <Box sx={{ display: "flex", gap: 2 }}>
        <Button
          variant="outlined"
          fullWidth
          onClick={() => navigate("/subscriptions")}
        >
          Back
        </Button>
        <Button
          variant="contained"
          fullWidth
          onClick={handleConfirmGroup}
        >
          Confirm Group
        </Button>
      </Box>
    </Container>
  );
};

export default GroupSetup;
