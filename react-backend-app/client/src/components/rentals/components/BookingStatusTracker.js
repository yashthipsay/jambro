import React from 'react';

// Map your existing booking statuses to rental tracking steps
const STEPS = [
  { key: "payment", label: "Payment", statuses: ["payment_pending"] },
  { key: "confirmed", label: "Confirmed", statuses: ["NOT_STARTED"] },
  { key: "arranging", label: "Arranging Pickup", statuses: ["arranging_pickup"] },
  { key: "ready", label: "Ready for Pickup", statuses: ["ready_to_ship"] },
  { key: "transit", label: "In Transit", statuses: ["in_transit"] },
  { key: "delivered", label: "Delivered", statuses: ["delivered"] },
  { key: "completed", label: "Rental Complete", statuses: ["COMPLETED"] },
];

const STATUS_MESSAGES = {
  payment_pending: "Complete payment to confirm your instrument rental.",
  NOT_STARTED: "Booking confirmed! We're preparing your instrument for pickup.",
  arranging_pickup: "Finding the best pickup time for your convenience.",
  ready_to_ship: "Your instrument is ready for pickup at the scheduled time.",
  in_transit: "Your instrument is on the way to you.",
  delivered: "Delivered! Enjoy your rental session.",
  COMPLETED: "Rental completed. Thank you for choosing GigSaw!",
  TERMINATED: "Booking was cancelled. Refund processed if applicable.",
};

/**
 * Resolve current step index from booking status
 */
function getCurrentStepIndex(status) {
  const idx = STEPS.findIndex((s) => s.statuses.includes(status));
  return idx === -1 ? 0 : idx;
}

/**
 * BookingStatusTracker - Mobile-first horizontal stepper
 * Integrates with existing GigSaw booking statuses
 * 
 * Props:
 * - status: 'payment_pending'|'NOT_STARTED'|'arranging_pickup'|'ready_to_ship'|
 *          'in_transit'|'delivered'|'COMPLETED'|'TERMINATED'
 * - bookingId?: string
 * - className?: string
 */
export default function BookingStatusTracker({ 
  status, 
  bookingId = '', 
  className = '' 
}) {
  const currentIndex = getCurrentStepIndex(status);
  const message = STATUS_MESSAGES[status] || "Status updating...";
  
  // Handle terminated/cancelled bookings
  if (status === 'TERMINATED') {
    return (
      <section
        className={`w-full rounded-xl border border-red-200 bg-red-50 p-4 shadow-sm ${className}`}
        aria-label="Booking status tracker"
      >
        <header className="mb-3">
          <h3 className="text-lg font-bold text-red-600">Booking Cancelled</h3>
          {bookingId && (
            <p className="text-sm text-gray-600">
              ID: <span className="font-medium">#{bookingId.slice(-6)}</span>
            </p>
          )}
        </header>
        
        <div className="rounded-lg border border-red-200 bg-red-100 p-3">
          <p className="text-sm text-red-700">{message}</p>
        </div>
      </section>
    );
  }

  return (
    <section
      className={`w-full rounded-xl border border-indigo-200 bg-indigo-50/50 p-4 shadow-sm ${className}`}
      aria-label="Booking status tracker"
    >
      {/* Mobile-First Header */}
      <header className="mb-4">
        <h3 className="text-lg font-bold text-indigo-700">Rental Tracking</h3>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <p className="text-sm text-gray-700">
            Status: <span className="font-semibold text-indigo-600">{STEPS[currentIndex]?.label}</span>
          </p>
          {bookingId && (
            <p className="text-xs text-gray-500">
              ID: <span className="font-medium">#{bookingId.slice(-6)}</span>
            </p>
          )}
        </div>
      </header>

      {/* Mobile-Optimized Stepper */}
      <div className="relative mb-4">
        <div 
          className="flex items-start gap-2 overflow-x-auto pb-2 scrollbar-hide" 
          role="list"
          style={{ scrollSnapType: 'x mandatory' }}
        >
          {STEPS.map((step, i) => {
            const state = i < currentIndex ? "complete" : i === currentIndex ? "current" : "pending";
            
            return (
              <div 
                key={step.key} 
                role="listitem" 
                className="flex flex-col items-center min-w-fit px-2"
                style={{ scrollSnapAlign: 'start' }}
              >
                {/* Step Node */}
                <div className="flex items-center mb-2">
                  <div
                    className={`relative grid size-8 sm:size-10 place-items-center rounded-full border-2 transition-all duration-300 ${
                      state === "complete"
                        ? "bg-green-500 border-green-500 text-white shadow-lg shadow-green-500/30"
                        : state === "current"
                          ? "bg-indigo-500 border-indigo-500 text-white shadow-lg shadow-indigo-500/30 ring-4 ring-indigo-200"
                          : "bg-gray-100 border-gray-300 text-gray-500"
                    }`}
                    aria-current={state === "current" ? "step" : undefined}
                    aria-label={`${step.label} ${state}`}
                  >
                    {state === "complete" ? (
                      <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    ) : (
                      <span
                        className={`text-[10px] sm:text-xs leading-none font-bold ${
                          state === "current" ? "animate-pulse" : ""
                        }`}
                      >
                        {i + 1}
                      </span>
                    )}
                  </div>
                  
                  {/* Connector Line */}
                  {i < STEPS.length - 1 && (
                    <div
                      className={`ml-2 h-0.5 w-8 sm:w-12 rounded-full transition-all duration-300 ${
                        i < currentIndex 
                          ? "bg-green-500" 
                          : i === currentIndex 
                            ? "bg-gradient-to-r from-indigo-500 to-gray-300" 
                            : "bg-gray-300"
                      }`}
                      aria-hidden="true"
                    />
                  )}
                </div>
                
                {/* Step Label */}
                <span
                  className={`text-[10px] sm:text-xs font-medium text-center leading-tight max-w-[60px] sm:max-w-[80px] ${
                    state === "complete"
                      ? "text-green-600"
                      : state === "current"
                        ? "text-indigo-600"
                        : "text-gray-500"
                  }`}
                >
                  {step.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Status Message */}
      <div className="rounded-lg border border-indigo-200 bg-indigo-100/50 p-3 mb-4">
        <p className="text-sm text-gray-700 leading-relaxed">{message}</p>
      </div>

      {/* Mobile-Friendly Legend */}
      <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500">
        <span className="flex items-center gap-2">
          <span className="inline-block size-2 rounded-full bg-green-500" aria-hidden="true" />
          Completed
        </span>
        <span className="flex items-center gap-2">
          <span className="inline-block size-2 rounded-full bg-indigo-500" aria-hidden="true" />
          Current
        </span>
        <span className="flex items-center gap-2">
          <span className="inline-block size-2 rounded-full bg-gray-400" aria-hidden="true" />
          Pending
        </span>
      </div>
    </section>
  );
}