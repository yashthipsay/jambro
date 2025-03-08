import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography } from '@mui/material';

const CancelSubscriptionDialog = ({ 
  open, 
  onClose, 
  onConfirm, 
  subscriptionDetails 
}) => (
  <Dialog open={open} onClose={onClose}>
    <DialogTitle>Cancel Subscription?</DialogTitle>
    <DialogContent>
      <Typography>
        {subscriptionDetails ? (
          `Are you sure you want to cancel your ${subscriptionDetails.tier} plan? 
           You will continue to have access until ${subscriptionDetails.nextBilling}.`
        ) : (
          'Are you sure you want to cancel your subscription?'
        )}
      </Typography>
    </DialogContent>
    <DialogActions>
      <Button 
        onClick={onClose}
        variant="outlined"
        sx={{ 
          color: 'primary.main',
          '&:hover': {
            backgroundColor: 'primary.50'
          }
        }}
      >
        Keep Plan
      </Button>
      <Button 
        color="error"
        variant="contained"
        onClick={onConfirm}
        sx={{
          '&:hover': {
            backgroundColor: 'error.dark'
          }
        }}
      >
        Cancel Plan
      </Button>
    </DialogActions>
  </Dialog>
);

export default CancelSubscriptionDialog;