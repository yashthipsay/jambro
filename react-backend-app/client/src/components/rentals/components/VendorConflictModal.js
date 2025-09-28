import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogActions,
} from '@mui/material';
import { Button, Typography, Box, Alert } from '@mui/material';
import { AlertTriangle, ShoppingCart, Trash2 } from 'lucide-react';

const VendorConflictModal = ({
  isOpen,
  onClose,
  pendingItem,
  conflictingItems,
  currentVendorName,
  newVendorName,
  onClearAndAdd,
  onCancel
}) => {
  if (!pendingItem) return null;

  const handleClearAndAdd = () => {
    onClearAndAdd(pendingItem);
    onClose();
  };

  const handleCancel = () => {
    onCancel();
    onClose();
  };

  return (
    <Dialog
      open={isOpen}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
          mx: 2,
        }
      }}
    >
      <DialogHeader sx={{ pb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <AlertTriangle className="w-6 h-6 text-orange-500" />
          <DialogTitle sx={{ p: 0, fontSize: '1.25rem', fontWeight: 600 }}>
            Vendor Conflict Detected
          </DialogTitle>
        </Box>
        <DialogDescription sx={{ mt: 1, color: 'text.secondary' }}>
          You can only rent items from one vendor at a time
        </DialogDescription>
      </DialogHeader>

      <DialogContent sx={{ pt: 1 }}>
        <Alert severity="warning" sx={{ mb: 3 }}>
          Your cart currently contains items from <strong>{currentVendorName}</strong>, 
          but you're trying to add an item from <strong>{newVendorName}</strong>.
        </Alert>

        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
            Items that will be removed:
          </Typography>
          <Box sx={{ 
            maxHeight: 200, 
            overflowY: 'auto',
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 1,
            p: 2
          }}>
            {conflictingItems.map((item, index) => (
              <Box
                key={index}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 2,
                  py: 1,
                  borderBottom: index < conflictingItems.length - 1 ? '1px solid' : 'none',
                  borderColor: 'divider'
                }}
              >
                <Trash2 className="w-4 h-4 text-red-500" />
                <Box sx={{ flex: 1 }}>
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    {item.name || item.instrumentType || 'Unknown Item'}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    ₹{item.pricePerHour || item.price || 0}/hour
                  </Typography>
                </Box>
              </Box>
            ))}
          </Box>
        </Box>

        <Box sx={{ 
          p: 2, 
          bgcolor: 'success.main', 
          bgcolor: 'rgba(76, 175, 80, 0.1)',
          borderRadius: 1,
          border: '1px solid',
          borderColor: 'success.main',
          borderColor: 'rgba(76, 175, 80, 0.3)'
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <ShoppingCart className="w-4 h-4 text-green-600" />
            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'success.dark' }}>
                Item to be added:
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {pendingItem.name || pendingItem.instrumentType || 'Unknown Item'} - 
                ₹{pendingItem.pricePerHour || pendingItem.price || 0}/hour
              </Typography>
            </Box>
          </Box>
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 3, gap: 2 }}>
        <Button
          variant="outlined"
          onClick={handleCancel}
          sx={{ minWidth: 100 }}
        >
          Cancel
        </Button>
        <Button
          variant="contained"
          color="primary"
          onClick={handleClearAndAdd}
          sx={{ 
            minWidth: 120,
            bgcolor: 'primary.main',
            '&:hover': {
              bgcolor: 'primary.dark'
            }
          }}
        >
          Clear & Add
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default VendorConflictModal;