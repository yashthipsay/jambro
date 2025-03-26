import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from './dialog';
import { X } from 'lucide-react';
import { Button } from './button';
import { useEffect } from 'react';

const UserInfoModal = ({ isOpen, onClose, userInfo }) => {
  useEffect(() => {
    console.log(userInfo);
  }, [userInfo]);
  return (
    <Dialog open={isOpen} onOpenChange={onClose} className="relative z-50">
      <DialogContent className="bg-gradient-to-b from-gray-900/95 to-black/95 border border-[#7DF9FF]/30 text-white sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="text-[#7DF9FF]">Booking Details</DialogTitle>
          <DialogDescription className="text-gray-300">
            Booking #{userInfo?.bookingInfo?.id?.slice(-4)}
          </DialogDescription>
        </DialogHeader>

        {userInfo && (
          <div className="space-y-6">
            {/* User Information Section */}
            <div className="space-y-2">
              <h3 className="text-[#7DF9FF]">Customer Information</h3>
              <p className="text-gray-200">Name: {userInfo.name}</p>
              <p className="text-gray-200">Email: {userInfo.email}</p>
              <p className="text-gray-200">Phone: {userInfo.savedNumber}</p>
            </div>

            {/* Booking Status Section */}
            <div className="space-y-2">
              <h3 className="text-[#7DF9FF]">Booking Status</h3>
              <p className="text-gray-200">
                Status: {userInfo.bookingInfo?.status}
              </p>
              <p className="text-gray-200">
                Session Date:{' '}
                {new Date(userInfo.bookingInfo?.date).toLocaleDateString()}
              </p>
            </div>

            {/* Time Slots Section */}
            <div className="space-y-2">
              <h3 className="text-[#7DF9FF]">Time Slots</h3>
              <div className="grid grid-cols-2 gap-2">
                {userInfo.bookingInfo?.slots?.map((slot, index) => (
                  <div key={index} className="bg-black/20 p-2 rounded">
                    <p className="text-gray-200">
                      {slot.startTime} - {slot.endTime}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        <DialogFooter>
          <Button
            onClick={onClose}
            className="bg-[#7DF9FF]/20 hover:bg-[#7DF9FF]/30 text-white border-[#7DF9FF]/30"
          >
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default UserInfoModal;
