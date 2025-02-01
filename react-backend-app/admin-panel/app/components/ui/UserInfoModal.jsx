import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter 
} from "./dialog";
import { X } from 'lucide-react';
import { Button } from './button';

const UserInfoModal = ({ isOpen, onClose, userInfo }) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>User Information</DialogTitle>
        </DialogHeader>
        
        <div className="mt-4">
          <p><strong>Name:</strong> {userInfo?.name}</p>
          <p><strong>Email:</strong> {userInfo?.email}</p>
          <p><strong>Phone Number:</strong> {userInfo?.savedNumber || 'N/A'}</p>
        </div>

        <DialogFooter>
          <Button onClick={onClose} variant="secondary">
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default UserInfoModal;