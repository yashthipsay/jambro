import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  RadioGroup,
  FormControlLabel,
  Radio,
  CircularProgress
} from '@mui/material';
import { useSubscription } from '../../context/SubscriptionContext';

const CancelSubscriptionDialog = () => {
  const { 
    showCancelDialog, 
    setShowCancelDialog, 
    cancelSubscription,
    loading,
    error,
    subscription 
  } = useSubscription();
  const [cancelType, setCancelType] = React.useState('end');

  const handleCancel = async () => {
    await cancelSubscription(cancelType === 'end');
  };

  return (
    <Dialog 
      open={showCancelDialog} 
      onClose={() => !loading && setShowCancelDialog(false)}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle>Cancel Subscription</DialogTitle>
      <DialogContent>
        <Typography variant="body1" gutterBottom>
          Please select when you would like to cancel your subscription:
        </Typography>
        
        <RadioGroup
          value={cancelType}
          onChange={(e) => setCancelType(e.target.value)}
        >
          <FormControlLabel
            value="end"
            control={<Radio />}
            label="Cancel at end of billing cycle"
            disabled={loading}
          />
          <FormControlLabel
            value="immediate"
            control={<Radio />}
            label="Cancel immediately"
            disabled={loading}
          />
        </RadioGroup>

        {error && (
          <Typography color="error" variant="body2" sx={{ mt: 2 }}>
            {error}
          </Typography>
        )}
      </DialogContent>
      <DialogActions>
        <Button 
          onClick={() => setShowCancelDialog(false)} 
          disabled={loading}
        >
          Close
        </Button>
        <Button 
          onClick={handleCancel}
          variant="contained" 
          color="error"
          disabled={loading}
          startIcon={loading && <CircularProgress size={20} />}
        >
          {loading ? 'Cancelling...' : 'Confirm Cancellation'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CancelSubscriptionDialog;