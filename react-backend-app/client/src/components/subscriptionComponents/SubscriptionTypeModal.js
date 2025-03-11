import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  Button,
  Typography,
  Box,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormControl,
} from '@mui/material';
import { UserPlus, User } from 'lucide-react';
import { subscriptionColors } from './SubscriptionsPage';

const SubscriptionTypeModal = ({ open, onClose, onSelect, tier }) => {
  const [type, setType] = React.useState('INDIVIDUAL');

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          bgcolor: subscriptionColors.cardBackground,
        }
      }}
    >
      <DialogTitle sx={{ 
        textAlign: 'center',
        color: subscriptionColors.textColor,
        fontWeight: 600,
        pt: 4 
      }}>
        Choose Subscription Type
      </DialogTitle>
      
      <DialogContent>
        <FormControl fullWidth>
          <RadioGroup
            value={type}
            onChange={(e) => setType(e.target.value)}
          >
            <Box sx={{
              display: 'grid',
              gap: 2,
              mb: 3,
              mt: 1
            }}>
              <FormControlLabel
                value="INDIVIDUAL"
                control={<Radio />}
                label={
                  <Box sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 2,
                    p: 2,
                    border: `1px solid ${type === 'INDIVIDUAL' ? subscriptionColors.primaryColor : '#e0e0e0'}`,
                    borderRadius: 2,
                    width: '100%',
                    bgcolor: type === 'INDIVIDUAL' ? 'rgba(100, 52, 252, 0.05)' : 'transparent'
                  }}>
                    <User size={24} color={subscriptionColors.primaryColor} />
                    <Box>
                      <Typography variant="subtitle1" fontWeight={500}>Individual</Typography>
                      <Typography variant="body2" color="text.secondary">
                        Single user subscription
                      </Typography>
                    </Box>
                  </Box>
                }
                sx={{ margin: 0 }}
              />

              <FormControlLabel
                value="GROUP"
                control={<Radio />}
                label={
                  <Box sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 2,
                    p: 2,
                    border: `1px solid ${type === 'GROUP' ? subscriptionColors.primaryColor : '#e0e0e0'}`,
                    borderRadius: 2,
                    width: '100%',
                    bgcolor: type === 'GROUP' ? 'rgba(100, 52, 252, 0.05)' : 'transparent'
                  }}>
                    <UserPlus size={24} color={subscriptionColors.primaryColor} />
                    <Box>
                      <Typography variant="subtitle1" fontWeight={500}>Band/Group</Typography>
                      <Typography variant="body2" color="text.secondary">
                        Up to 6 members (including you)
                      </Typography>
                    </Box>
                  </Box>
                }
                sx={{ margin: 0 }}
              />
            </Box>
          </RadioGroup>

          <Button
            variant="contained"
            fullWidth
            sx={{
              bgcolor: subscriptionColors.primaryColor,
              py: 1.5,
              borderRadius: 2,
              '&:hover': {
                bgcolor: subscriptionColors.accentColor,
              }
            }}
            onClick={() => onSelect(type, tier)}
          >
            Continue
          </Button>
        </FormControl>
      </DialogContent>
    </Dialog>
  );
};

export default SubscriptionTypeModal;