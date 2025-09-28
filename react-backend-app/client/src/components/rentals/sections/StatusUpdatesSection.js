import React from 'react';
import { Bell } from 'lucide-react';

const StatusUpdatesSection = ({ bookedInstruments }) => {
  const pendingUpdates = bookedInstruments.filter(item => !['delivered', 'COMPLETED'].includes(item.status));

  return (
    <div className="px-4 py-8 pb-32 md:pb-8">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-2xl sm:text-3xl font-bold text-indigo-700 mb-6">Status Updates</h2>
        
        <div className="space-y-4">
          {pendingUpdates.map((rental) => (
            <div key={rental.id} className="bg-gradient-to-r from-yellow-50 to-orange-50 backdrop-blur-sm rounded-xl border border-yellow-200 p-4 shadow-sm">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-yellow-200 rounded-lg">
                  <Bell className="w-5 h-5 text-yellow-700" />
                </div>
                <div className="flex-1">
                  <h3 className="text-gray-800 font-semibold">{rental.name}</h3>
                  <p className="text-gray-700 text-sm mb-2">
                    Your rental status has been updated to: <span className="text-indigo-600 font-medium">{rental.status.replace('_', ' ')}</span>
                  </p>
                  <p className="text-gray-500 text-xs">Booking ID: {rental.bookingId}</p>
                </div>
                <div className="text-gray-500 text-xs">
                  2 hours ago
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default StatusUpdatesSection;