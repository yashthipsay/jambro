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
  CircularProgress,
  Paper,
  Divider,
  Card,
  CardContent,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import { X, Info, UserPlus, Users, Plus, CheckCircle } from "lucide-react";
import { useSubscription } from "../../context/SubscriptionContext";
import { useAuth0 } from "@auth0/auth0-react";

const GroupSetup = () => {
  const navigate = useNavigate();
  const { subscription } = useSubscription();
  const { user } = useAuth0();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [memberEmails, setMemberEmails] = useState([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [groups, setGroups] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch user's groups when component mounts
  useEffect(() => {
    const fetchGroups = async () => {
      if (!user) return;

      try {
        setIsLoading(true);

        // First get the database userId
        const userResponse = await fetch("https://api.vision.gigsaw.co.in/api/users", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email: user.email }),
        });

        const userData = await userResponse.json();
        if (!userData.success) {
          throw new Error("Failed to get user details");
        }

        const userId = userData.data._id;

        // Fetch user's groups
        const groupsResponse = await fetch(
          `https://api.vision.gigsaw.co.in/api/groups/admin/${userId}`
        );
        const groupsData = await groupsResponse.json();

        if (groupsData.success) {
          setGroups(groupsData.data || []);
        }
      } catch (error) {
        console.error("Error fetching groups:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchGroups();
  }, [user]);

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

    if (email === user?.email) {
      setError("You cannot add yourself as a member");
      return;
    }

    if (memberEmails.length >= 5) {
      setError("Maximum 5 members allowed");
      return;
    }

    setMemberEmails([...memberEmails, email]);
    setEmail("");
    setError("");
  };

  const handleRemoveMember = (emailToRemove) => {
    setMemberEmails(memberEmails.filter((email) => email !== emailToRemove));
  };

  const handleCreateGroup = async () => {
    if (!groupName.trim()) {
      setError("Please enter a group name");
      return;
    }

    if (!subscription || subscription.status !== "ACTIVE") {
      setError("You need an active subscription to create a group");
      return;
    }

    try {
      setIsSaving(true);

      // First get the database userId
      const userResponse = await fetch("https://api.vision.gigsaw.co.in/api/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: user.email }),
      });

      const userData = await userResponse.json();
      if (!userData.success) {
        throw new Error("Failed to get user details");
      }

      const userId = userData.data._id;

      // Create the group
      const response = await fetch("https://api.vision.gigsaw.co.in/api/groups/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          adminId: userId,
          adminEmail: user.email,
          groupName: groupName,
          memberEmails: memberEmails,
          subscriptionId: subscription._id,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setSuccessMessage("Group created successfully!");
        setGroups([...groups, data.data]);
        setShowCreateForm(false);
        setMemberEmails([]);
        setGroupName("");
      } else {
        setError(data.message || "Failed to create group");
      }
    } catch (error) {
      console.error("Error creating group:", error);
      setError("An error occurred while creating the group");
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdateGroupMembers = async (groupId, groupMembers) => {
    // Implementation for updating group members
  };

  const handleDeleteGroup = async (groupId) => {
    try {
      // First get the database userId
      const userResponse = await fetch("https://api.vision.gigsaw.co.in/api/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: user.email }),
      });

      const userData = await userResponse.json();
      if (!userData.success) {
        throw new Error("Failed to get user details");
      }

      const userId = userData.data._id;

      // Delete the group
      const response = await fetch(
        `https://api.vision.gigsaw.co.in/api/groups/${groupId}`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            adminId: userId,
          }),
        }
      );

      const data = await response.json();
      if (data.success) {
        setSuccessMessage("Group deleted successfully!");
        // Remove the deleted group from state
        setGroups(groups.filter((group) => group.groupId !== groupId));
      } else {
        setError(data.message || "Failed to delete group");
      }
    } catch (error) {
      console.error("Error deleting group:", error);
      setError("An error occurred while deleting the group");
    }
  };

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography
          variant="h4"
          gutterBottom
          sx={{ display: "flex", alignItems: "center", gap: 1 }}
        >
          <Users size={32} /> My Groups
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Manage your subscription groups
        </Typography>
      </Box>

      {successMessage && (
        <Alert
          severity="success"
          sx={{ mb: 3 }}
          icon={<CheckCircle />}
          onClose={() => setSuccessMessage("")}
        >
          {successMessage}
        </Alert>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError("")}>
          {error}
        </Alert>
      )}

      {/* Create New Group Button */}
      {!showCreateForm && (
        <Button
          variant="contained"
          startIcon={<Plus />}
          sx={{ mb: 4 }}
          onClick={() => setShowCreateForm(true)}
          disabled={!subscription || subscription.status !== "ACTIVE"}
        >
          Create a Group for Your Subscription
        </Button>
      )}

      {/* Create Group Form */}
      {showCreateForm && (
        <Card sx={{ mb: 4 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Create New Group
            </Typography>

            <Box sx={{ mb: 3 }}>
              <TextField
                fullWidth
                label="Group Name"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                margin="normal"
                variant="outlined"
              />
            </Box>

            <Divider sx={{ my: 2 }} />

            <Typography variant="subtitle1" gutterBottom>
              Add Members (up to 5)
            </Typography>

            <Box sx={{ mb: 3 }}>
              <Box sx={{ display: "flex", gap: 1, mb: 1 }}>
                <TextField
                  fullWidth
                  label="Member Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter member email address"
                  variant="outlined"
                  size="medium"
                />
                <Button
                  variant="contained"
                  onClick={handleAddMember}
                  disabled={memberEmails.length >= 5 || isSaving}
                  sx={{ minWidth: "120px" }}
                >
                  Add
                </Button>
              </Box>

              {memberEmails.length >= 5 && (
                <Alert severity="info" sx={{ mt: 2 }}>
                  Maximum number of members reached (5)
                </Alert>
              )}
            </Box>

            {memberEmails.length > 0 && (
              <List
                sx={{
                  mb: 4,
                  bgcolor: "background.paper",
                  borderRadius: 2,
                  boxShadow: 1,
                }}
              >
                {memberEmails.map((memberEmail) => (
                  <ListItem key={memberEmail} divider>
                    <ListItemText primary={memberEmail} />
                    <ListItemSecondaryAction>
                      <IconButton
                        edge="end"
                        onClick={() => handleRemoveMember(memberEmail)}
                        size="small"
                        disabled={isSaving}
                      >
                        <X size={18} />
                      </IconButton>
                    </ListItemSecondaryAction>
                  </ListItem>
                ))}
              </List>
            )}

            <Box sx={{ display: "flex", gap: 2, mt: 2 }}>
              <Button
                variant="outlined"
                onClick={() => setShowCreateForm(false)}
                disabled={isSaving}
              >
                Cancel
              </Button>
              <Button
                variant="contained"
                onClick={handleCreateGroup}
                disabled={
                  isSaving || !groupName.trim() || memberEmails.length === 0
                }
                startIcon={
                  isSaving ? (
                    <CircularProgress size={20} color="inherit" />
                  ) : null
                }
              >
                {isSaving ? "Creating..." : "Create Group"}
              </Button>
            </Box>
          </CardContent>
        </Card>
      )}

      {/* Existing Groups */}
      <Typography variant="h6" gutterBottom sx={{ mt: 4 }}>
        Your Groups
      </Typography>

      {isLoading ? (
        <Box sx={{ display: "flex", justifyContent: "center", my: 4 }}>
          <CircularProgress />
        </Box>
      ) : groups.length > 0 ? (
        groups.map((group) => (
          <Card key={group.groupId} sx={{ mb: 3 }}>
            <CardContent>
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  mb: 2,
                }}
              >
                <Typography variant="h6">{group.groupName}</Typography>
                <Button
                  size="small"
                  variant="outlined"
                  color="error"
                  onClick={() => handleDeleteGroup(group.groupId)}
                >
                  Delete
                </Button>
              </Box>

              <Divider sx={{ mb: 2 }} />

              <Typography variant="subtitle2" gutterBottom>
                Members:
              </Typography>

              <List dense>
                {group.groupMembers.map((member, index) => (
                  <ListItem
                    key={index}
                    divider={index < group.groupMembers.length - 1}
                  >
                    <ListItemText
                      primary={member.email}
                      secondary={
                        member.role === "ADMIN"
                          ? "Admin"
                          : `Member (${member.status.toLowerCase()})`
                      }
                    />
                    {member.role !== "ADMIN" && (
                      <ListItemSecondaryAction>
                        <IconButton
                          edge="end"
                          size="small"
                          onClick={() => {
                            const updatedMembers = group.groupMembers.filter(
                              (m) => m.email !== member.email
                            );
                            handleUpdateGroupMembers(
                              group.groupId,
                              updatedMembers
                            );
                          }}
                        >
                          <X size={16} />
                        </IconButton>
                      </ListItemSecondaryAction>
                    )}
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        ))
      ) : (
        <Paper sx={{ p: 3, textAlign: "center", bgcolor: "background.paper" }}>
          <Typography color="text.secondary">
            You don't have any groups yet. Create a group to share your
            subscription.
          </Typography>
        </Paper>
      )}
    </Container>
  );
};

export default GroupSetup;
