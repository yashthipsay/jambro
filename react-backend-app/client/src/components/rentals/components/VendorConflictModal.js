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
        <DialogTitle sx={{ m: 0 }}>Vendor Constraint Violation</DialogTitle>
      </Box>
      <DialogContent dividers>
        <DialogContentText gutterBottom>
          You can only rent items from one vendor at a time. Your cart currently contains items from a different vendor.
        </DialogContentText>

        <Alert severity="warning" sx={{ mb: 2 }}>
          Your cart has items from <strong>{currentVendorName}</strong>, but you're trying to add an item from <strong>{newVendorName}</strong>.
        </Alert>

        <Typography variant="subtitle2" gutterBottom sx={{ mt: 2, fontWeight: 600 }}>
          Items that will be removed from cart:
        </Typography>
        <Box sx={{ maxHeight: 200, overflowY: 'auto', border: 1, borderColor: 'divider', borderRadius: 1, p: 1, bgcolor: 'grey.50' }}>
          {conflictingItems.map((item, i) => (
            <Box
              key={i}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                py: 1,
                px: 1,
                borderBottom: i < conflictingItems.length - 1 ? '1px solid' : 'none',
                borderColor: 'divider',
                '&:hover': { bgcolor: 'grey.100' }
              }}
            >
              <Trash2 color="#f44336" size={16} />
              <Box sx={{ flex: 1 }}>
                <Typography variant="body2" fontWeight={500}>
                  {item.name || item.instrumentType || 'Unknown Item'}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  ₹{item.pricePerDay || item.pricePerHour || item.price || 0}/day
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
          <ShoppingCart color="#2e7d32" size={20} />
          <Box>
            <Typography variant="subtitle2" fontWeight={600} color="success.dark">
              New item to be added:
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {pendingItem.name || pendingItem.instrumentType || 'Unknown Item'} – ₹
              {pendingItem.pricePerDay || pendingItem.pricePerHour || pendingItem.price || 0}/day
            </Typography>
            <Typography variant="caption" color="success.dark">
              from {newVendorName}
            </Typography>
          </Box>
        </Box>

        <Alert severity="info" sx={{ mt: 2 }}>
          <strong>What happens next?</strong><br />
          • <strong>Clear & Add:</strong> Remove all current items and add the new item<br />
          • <strong>Cancel:</strong> Keep your current cart unchanged
        </Alert>
      </DialogContent>
      <DialogActions sx={{ px: 2, pb: 2, gap: 1 }}>
        <Button variant="outlined" onClick={handleCancel} color="inherit">
          Cancel & Keep Current Cart
        </Button>
        <Button variant="contained" onClick={handleClearAndAdd} color="warning">
          Clear Cart & Add New Item
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default VendorConflictModal;