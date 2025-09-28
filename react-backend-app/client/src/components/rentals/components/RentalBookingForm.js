"use client";

import { useMemo, useState } from "react";
import { X, Calendar, Package, CreditCard } from "lucide-react";

/**
 * RentalBookingForm - Multi-step booking form for instrument rentals
 * 
 * Props:
 * - instrument: { id, name, type, pricePerDay, imageUrl }
 * - initialValues?: { name?, phone?, address?, startDate?, endDate? }
 * - onCalculate?: (values) => Promise<{ deliveryFee, rentalAmount, total }> | { deliveryFee, rentalAmount, total }
 * - onConfirm?: (values) => Promise<void> | void
 * - onClose?: () => void
 * - isOpen?: boolean
 */
export default function RentalBookingForm({ 
  instrument, 
  initialValues = {}, 
  onCalculate, 
  onConfirm, 
  onClose,
  isOpen = false 
}) {
  // Color palette matching your system
  const paletteStyle = {
    "--brand": "#6434fc",
    "--accent": "#8059f7", 
    "--secondary": "#a085eb",
    "--bg": "#f8f6ff",
    "--text": "#352c63",
    "--ok": "#4CAF50",
    "--warn": "#ff5722",
  };

  const [step, setStep] = useState(0);
  const [busy, setBusy] = useState(false);
  const [values, setValues] = useState({
    name: initialValues.name || "",
    phone: initialValues.phone || "",
    address: initialValues.address || "",
    startDate: initialValues.startDate || "",
    endDate: initialValues.endDate || "",
    duration: instrument?.duration || 1, // Use duration from cart item if available
    deliveryFee: initialValues.deliveryFee ?? undefined,
    rentalAmount: initialValues.rentalAmount ?? undefined,
    total: initialValues.total ?? undefined,
  });

  // Calculate duration when dates change
  const duration = useMemo(() => {
    if (values.startDate && values.endDate) {
      const start = new Date(values.startDate);
      const end = new Date(values.endDate);
      const diffTime = Math.abs(end - start);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // Include both start and end day
      return Math.max(1, diffDays);
    }
    return 1;
  }, [values.startDate, values.endDate]);

  // Update duration in values when calculated
  useMemo(() => {
    setValues(prev => ({ ...prev, duration }));
  }, [duration]);

  // Validation
  const step1Valid = useMemo(() => {
    const hasBasics = values.name.trim().length > 1 && 
                     values.phone.trim().length >= 8 && 
                     values.address.trim().length > 4;
    const hasDates = Boolean(values.startDate) && Boolean(values.endDate);
    const dateOk = hasDates && new Date(values.endDate) >= new Date(values.startDate);
    return hasBasics && dateOk;
  }, [values]);

  const step2Valid = useMemo(() => {
    const { deliveryFee, rentalAmount, total } = values;
    return typeof deliveryFee === "number" && 
           typeof rentalAmount === "number" && 
           typeof total === "number" && 
           total >= 0;
  }, [values]);

  function update(key, v) {
    setValues(prev => ({ ...prev, [key]: v }));
  }

  async function handleCalculate() {
    if (!onCalculate) {
      // Default calculation if no handler provided
      const baseRental = (instrument?.pricePerDay || 500) * duration;
      const deliveryFee = 100; // Default delivery fee
      const total = baseRental + deliveryFee;
      
      setValues(prev => ({
        ...prev,
        deliveryFee,
        rentalAmount: baseRental,
        total
      }));
      return;
    }

    try {
      setBusy(true);
      const res = await onCalculate({ 
        ...values, 
        instrumentId: instrument?.id,
        duration 
      });
      
      if (res && typeof res === "object") {
        const { deliveryFee, rentalAmount, total } = res;
        setValues(prev => ({
          ...prev,
          deliveryFee,
          rentalAmount,
          total,
        }));
      }
    } finally {
      setBusy(false);
    }
  }

  async function handleConfirm() {
    if (!onConfirm) return;
    setBusy(true);
    try {
      await onConfirm({ 
        ...values, 
        instrumentId: instrument?.id,
        instrumentName: instrument?.name,
        instrumentType: instrument?.type
      });
      // Reset form and close
      setStep(0);
      setValues({
        name: "",
        phone: "",
        address: "",
        startDate: "",
        endDate: "",
        duration: 1,
        deliveryFee: undefined,
        rentalAmount: undefined,
        total: undefined,
      });
      onClose?.();
    } finally {
      setBusy(false);
    }
  }

  const steps = [
    { key: "details", label: "Details & Dates" },
    { key: "delivery", label: "Delivery & Price" },
    { key: "confirm", label: "Confirmation" },
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-sm">
      <div
        style={paletteStyle}
        className="w-full max-w-md rounded-t-xl bg-[var(--bg)] text-[var(--text)] shadow-xl animate-slide-up max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="sticky top-0 bg-white/95 backdrop-blur-sm border-b border-indigo-200 p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {instrument?.imageUrl && (
              <img 
                src={instrument.imageUrl} 
                alt={instrument.name}
                className="w-12 h-12 rounded-lg object-cover border border-indigo-100"
              />
            )}
            <div>
              <h2 className="text-lg font-semibold">Book Rental</h2>
              <p className="text-sm opacity-70">{instrument?.name}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-indigo-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Progress */}
        <div className="p-4 pb-2">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium">Step {step + 1} of {steps.length}</span>
            <span className="text-xs opacity-70">{steps[step]?.label}</span>
          </div>

          <div className="flex items-center gap-2">
            {steps.map((s, i) => {
              const state = i < step ? "done" : i === step ? "current" : "todo";
              return (
                <div key={s.key} className="flex items-center gap-2">
                  <div
                    className={`
                      w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold
                      ${state === "done" 
                        ? "bg-green-500 text-white" 
                        : state === "current"
                          ? "bg-[var(--brand)] text-white ring-2 ring-indigo-200"
                          : "bg-white text-[var(--text)] border border-indigo-200"
                      }
                    `}
                  >
                    {i + 1}
                  </div>
                  {i < steps.length - 1 && (
                    <div
                      className={`
                        h-1 w-8 rounded-full
                        ${i < step 
                          ? "bg-green-500" 
                          : i === step 
                            ? "bg-[var(--accent)]/60" 
                            : "bg-indigo-100"
                        }
                      `}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Content */}
        <div className="p-4">
          {/* Step 1: Details & Dates */}
          {step === 0 && (
            <div className="space-y-4">
              <div className="bg-white rounded-xl border border-indigo-100 p-4 space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Full Name</label>
                  <input
                    type="text"
                    placeholder="Your name"
                    value={values.name}
                    onChange={(e) => update("name", e.target.value)}
                    className={`
                      w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2
                      ${values.name.trim().length > 1
                        ? "border-indigo-200 focus:ring-indigo-200 focus:border-indigo-400"
                        : "border-red-300 focus:border-red-500"
                      }
                    `}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Phone Number</label>
                  <input
                    type="tel"
                    placeholder="+91 98765 43210"
                    value={values.phone}
                    onChange={(e) => update("phone", e.target.value)}
                    className={`
                      w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2
                      ${values.phone.trim().length >= 8
                        ? "border-indigo-200 focus:ring-indigo-200 focus:border-indigo-400"
                        : "border-red-300 focus:border-red-500"
                      }
                    `}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Delivery Address</label>
                  <textarea
                    rows={3}
                    placeholder="Apartment, street, landmark, city..."
                    value={values.address}
                    onChange={(e) => update("address", e.target.value)}
                    className={`
                      w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 resize-none
                      ${values.address.trim().length > 4
                        ? "border-indigo-200 focus:ring-indigo-200 focus:border-indigo-400"
                        : "border-red-300 focus:border-red-500"
                      }
                    `}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium mb-2">Start Date</label>
                    <input
                      type="date"
                      value={values.startDate}
                      onChange={(e) => update("startDate", e.target.value)}
                      min={new Date().toISOString().split('T')[0]}
                      className={`
                        w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2
                        ${values.startDate
                          ? "border-indigo-200 focus:ring-indigo-200 focus:border-indigo-400"
                          : "border-red-300 focus:border-red-500"
                        }
                      `}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">End Date</label>
                    <input
                      type="date"
                      value={values.endDate}
                      onChange={(e) => update("endDate", e.target.value)}
                      min={values.startDate || new Date().toISOString().split('T')[0]}
                      className={`
                        w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2
                        ${values.endDate && new Date(values.endDate) >= new Date(values.startDate || 0)
                          ? "border-indigo-200 focus:ring-indigo-200 focus:border-indigo-400"
                          : "border-red-300 focus:border-red-500"
                        }
                      `}
                    />
                  </div>
                </div>

                {duration > 1 && (
                  <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-3">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-indigo-600" />
                      <span className="text-sm font-medium text-indigo-700">
                        Duration: {duration} day{duration > 1 ? 's' : ''}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Step 2: Delivery & Price */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="bg-white rounded-xl border border-indigo-100 p-4">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-medium text-indigo-700">Pricing Details</h3>
                    <p className="text-xs text-gray-600">Calculate delivery fee and total cost</p>
                  </div>
                  <button
                    onClick={handleCalculate}
                    disabled={busy || !step1Valid}
                    className={`
                      flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white transition-all
                      ${busy || !step1Valid
                        ? "bg-indigo-300 cursor-not-allowed"
                        : "bg-indigo-600 hover:bg-indigo-700 shadow-md hover:shadow-lg"
                      }
                    `}
                  >
                    <CreditCard className="w-4 h-4" />
                    {busy ? "Calculating..." : "Calculate Cost"}
                  </button>
                </div>

                <div className="space-y-3">
                  <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-3">
                    <div className="text-xs text-indigo-600 font-medium mb-1">Base Rental</div>
                    <div className="text-sm">
                      ₹{instrument?.pricePerDay || 500}/day × {duration} day{duration > 1 ? 's' : ''}
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <PriceStat
                      label="Delivery Fee"
                      value={typeof values.deliveryFee === "number" ? `₹${values.deliveryFee}` : "—"}
                    />
                    <PriceStat
                      label="Rental Amount"
                      value={typeof values.rentalAmount === "number" ? `₹${values.rentalAmount}` : "—"}
                    />
                    <PriceStat
                      label="Total"
                      value={typeof values.total === "number" ? `₹${values.total}` : "—"}
                      emphasis
                    />
                  </div>

                  {!step2Valid && (
                    <div className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg p-2">
                      Click "Calculate Cost" to get pricing details
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Confirmation */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="bg-white rounded-xl border border-indigo-100 p-4">
                <h3 className="font-medium text-indigo-700 mb-3 flex items-center gap-2">
                  <Package className="w-4 h-4" />
                  Booking Summary
                </h3>
                
                <div className="space-y-3 text-sm">
                  <SummaryRow label="Instrument" value={instrument?.name || "—"} />
                  <SummaryRow label="Type" value={instrument?.type || "—"} />
                  <SummaryRow label="Customer" value={values.name || "—"} />
                  <SummaryRow label="Phone" value={values.phone || "—"} />
                  <SummaryRow label="Address" value={values.address || "—"} />
                  <SummaryRow label="Start Date" value={values.startDate || "—"} />
                  <SummaryRow label="End Date" value={values.endDate || "—"} />
                  <SummaryRow label="Duration" value={`${duration} day${duration > 1 ? 's' : ''}`} />
                  
                  <div className="border-t border-indigo-100 pt-3 mt-3">
                    <SummaryRow 
                      label="Delivery Fee" 
                      value={typeof values.deliveryFee === "number" ? `₹${values.deliveryFee}` : "—"} 
                    />
                    <SummaryRow 
                      label="Rental Amount" 
                      value={typeof values.rentalAmount === "number" ? `₹${values.rentalAmount}` : "—"} 
                    />
                    <SummaryRow 
                      label="Total Amount" 
                      value={typeof values.total === "number" ? `₹${values.total}` : "—"}
                      strong
                    />
                  </div>
                </div>

                <div className="mt-4 p-3 bg-indigo-50 border border-indigo-200 rounded-lg">
                  <p className="text-xs text-indigo-700">
                    By confirming, you agree to our rental terms and conditions. The instrument will be delivered to your address.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-white/95 backdrop-blur-sm border-t border-indigo-200 p-4">
          <div className="flex items-center justify-between gap-3">
            <button
              onClick={() => setStep(s => Math.max(0, s - 1))}
              disabled={busy || step === 0}
              className={`
                px-4 py-2 rounded-lg text-sm font-medium transition-all
                ${step === 0
                  ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                  : "bg-white text-indigo-700 border border-indigo-200 hover:bg-indigo-50"
                }
              `}
            >
              Back
            </button>

            {step < 2 ? (
              <button
                onClick={() => setStep(s => Math.min(2, s + 1))}
                disabled={busy || (step === 0 && !step1Valid) || (step === 1 && !step2Valid)}
                className={`
                  px-6 py-2 rounded-lg text-sm font-medium text-white transition-all
                  ${(step === 0 && !step1Valid) || (step === 1 && !step2Valid)
                    ? "bg-indigo-300 cursor-not-allowed"
                    : "bg-indigo-600 hover:bg-indigo-700 shadow-md hover:shadow-lg"
                  }
                `}
              >
                Next
              </button>
            ) : (
              <button
                onClick={handleConfirm}
                disabled={busy}
                className={`
                  px-6 py-2 rounded-lg text-sm font-semibold text-white transition-all
                  ${busy 
                    ? "bg-indigo-500" 
                    : "bg-indigo-600 hover:bg-indigo-700 shadow-md hover:shadow-lg"
                  }
                `}
              >
                {busy ? "Confirming..." : "Confirm Booking"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Helper components
function PriceStat({ label, value, emphasis }) {
  return (
    <div className={`
      border rounded-lg p-3 text-center
      ${emphasis 
        ? "border-indigo-300 bg-indigo-50" 
        : "border-indigo-200 bg-indigo-50/50"
      }
    `}>
      <div className="text-xs text-indigo-600 mb-1">{label}</div>
      <div className={`text-sm ${emphasis ? "font-semibold text-indigo-700" : ""}`}>
        {value}
      </div>
    </div>
  );
}

function SummaryRow({ label, value, strong }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-gray-600">{label}</span>
      <span className={strong ? "font-semibold text-indigo-700" : ""}>{value}</span>
    </div>
  );
}