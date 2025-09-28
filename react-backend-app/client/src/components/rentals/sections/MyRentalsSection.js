import React from 'react';
import BookingStatusTracker from '../components/BookingStatusTracker';

const MyRentalsSection = ({ bookedInstruments, onSetActiveSection }) => {
  return (
    <div className="px-4 py-8 pb-32 md:pb-8">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-2xl sm:text-3xl font-bold text-indigo-700 mb-6">My Rentals</h2>
        
        {bookedInstruments.length > 0 ? (
          <div className="space-y-6">
            {bookedInstruments.map((rental) => (
              <div key={rental.id} className="bg-white/80 backdrop-blur-sm rounded-xl border border-indigo-100 p-4 shadow-sm">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-gray-800 font-semibold text-lg">{rental.name}</h3>
                    <p className="text-gray-600">Booking ID: {rental.bookingId}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    rental.status === 'delivered' ? 'bg-green-100 text-green-700' :
                    rental.status === 'in_transit' ? 'bg-blue-100 text-blue-700' :
                    'bg-yellow-100 text-yellow-700'
                  }`}>
                    {rental.status.replace('_', ' ').toUpperCase()}
                  </span>
                </div>
                
                <BookingStatusTracker 
                  status={rental.status}
                  bookingId={rental.bookingId}
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">📦</div>
            <h3 className="text-2xl font-bold text-indigo-600 mb-2">No active rentals</h3>
            <p className="text-gray-600 mb-6">You don't have any instrument rentals at the moment</p>
            <button 
              onClick={() => onSetActiveSection('instruments')}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-8 rounded-lg transition-all duration-300 transform hover:scale-105 shadow-md hover:shadow-lg"
            >
              Browse Instruments
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default MyRentalsSection;