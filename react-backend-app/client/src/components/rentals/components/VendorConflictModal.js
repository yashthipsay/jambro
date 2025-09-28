import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogContentText,
  Button,
  Box,
  Typography,
  Alert
} from '@mui/material';
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
    <Dialog open={isOpen} onClose={onClose} maxWidth="sm" fullWidth>
      <Box sx={{ display: 'flex', alignItems: 'center', px: 2, pt: 2, gap: 1 }}>
        <AlertTriangle color="#ed6c02" />
        <DialogTitle sx={{ m: 0 }}>Vendor Conflict Detected</DialogTitle>
      </Box>
      <DialogContent dividers>
        <DialogContentText gutterBottom>
          You can only rent items from one vendor at a time.
        </DialogContentText>

        <Alert severity="warning" sx={{ mb: 2 }}>
          Your cart contains items from <strong>{currentVendorName}</strong>, but you're adding an item from <strong>{newVendorName}</strong>.
        </Alert>

        <Typography variant="subtitle2" gutterBottom>
          Items that will be removed:
        </Typography>
        <Box sx={{ maxHeight: 200, overflowY: 'auto', border: 1, borderColor: 'divider', borderRadius: 1, p: 1 }}>
          {conflictingItems.map((item, i) => (
            <Box
              key={i}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                py: 0.5,
                borderBottom: i < conflictingItems.length - 1 ? '1px solid' : 'none',
                borderColor: 'divider'
              }}
            >
              <Trash2 color="#f44336" />
              <Box>
                <Typography variant="body2" fontWeight={500}>
                  {item.name || item.instrumentType || 'Unknown Item'}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  ₹{item.pricePerHour || item.price || 0}/hour
                </Typography>
              </Box>
            </Box>
          ))}
        </Box>

        <Box
          sx={{
            mt: 3,
            p: 2,
            bgcolor: 'success.light',
            borderRadius: 1,
            border: 1,
            borderColor: 'success.main',
            display: 'flex',
            alignItems: 'center',
            gap: 1
          }}
        >
          <ShoppingCart color="#2e7d32" />
          <Box>
            <Typography variant="subtitle2" fontWeight={600} color="success.dark">
              Item to be added:
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {pendingItem.name || pendingItem.instrumentType || 'Unknown Item'} – ₹
              {pendingItem.pricePerHour || pendingItem.price || 0}/hour
            </Typography>
          </Box>
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 2, pb: 2 }}>
        <Button variant="outlined" onClick={handleCancel}>
          Cancel
        </Button>
        <Button variant="contained" onClick={handleClearAndAdd}>
          Clear & Add
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default VendorConflictModal;