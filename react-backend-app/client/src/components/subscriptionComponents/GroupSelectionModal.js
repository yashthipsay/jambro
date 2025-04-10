import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  List,
  ListItem,
  ListItemText,
  Button,
  Divider,
  Typography,
  CircularProgress,
  Box,
} from "@mui/material";
import { Users, Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";

const GroupSelectionModal = ({ open, onClose, archivedGroups, isLoading }) => {
  const navigate = useNavigate();


  const handleSelectGroup = async (group) => {
    try {
      // Reactivate the group
      const response = await fetch(
        `http://localhost:5000/api/groups/${group.groupId}/reactivate`,
        {
          method: "POST",
        }
      );

      const data = await response.json();
      if (data.success) {
        onClose();
        navigate("/my-groups");
      }
    } catch (error) {
      console.error("Error reactivating group:", error);
    }
  };

  const handleCreateNewGroup = () => {
    onClose();
    navigate("/group-setup");
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <div className="flex items-center gap-2">
          <Users size={24} />
          Select Group Type
        </div>
      </DialogTitle>
      <DialogContent>
        {isLoading ? (
          <Box sx={{ display: "flex", justifyContent: "center", p: 3 }}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            {archivedGroups.length > 0 && (
              <>
                <Typography variant="subtitle1" gutterBottom>
                  Past Groups
                </Typography>
                <List>
                  {archivedGroups.map((group) => (
                    <ListItem
                      key={group.groupId}
                      button
                      onClick={() => handleSelectGroup(group)}
                    >
                      <ListItemText
                        primary={group.groupName}
                        secondary={`${
                          group.groupMembers.length
                        } members • Deactivated ${new Date(
                          group.deactivatedAt
                        ).toLocaleDateString()}`}
                      />
                    </ListItem>
                  ))}
                </List>
                <Divider sx={{ my: 2 }} />
              </>
            )}

            <Button
              fullWidth
              variant="contained"
              onClick={handleCreateNewGroup}
              startIcon={<Plus size={18} />}
            >
              Create New Group
            </Button>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default GroupSelectionModal;
