import { useState, useMemo, useCallback } from 'react';

export const useCartCalculations = (items = [], bookingDates = {}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Calculate duration between dates
  const duration = useMemo(() => {
    const { startDate, endDate } = bookingDates;
    if (!startDate || !endDate) return 1;

    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return Math.max(1, diffDays);
  }, [bookingDates.startDate, bookingDates.endDate]);

  // Memoize base calculations
  const baseCalculations = useMemo(() => {
    const subtotal = items.reduce((total, item) => {
      return total + (item.pricePerDay * duration);
    }, 0);

    // Base calculations
    const deliveryFee = 150; // Base delivery fee
    const deposit = Math.round(subtotal * 0.2); // 20% deposit
    const total = subtotal + deliveryFee + deposit;

    return {
      subtotal,
      deliveryFee,
      deposit,
      total,
      duration,
      breakdown: items.map(item => ({
        id: item.id,
        name: item.name,
        pricePerDay: item.pricePerDay,
        duration,
        total: item.pricePerDay * duration
      }))
    };
  }, [items, duration]);

  // Calculate prices with API (mocked for now)
  const calculatePrices = useCallback(async (address) => {
    try {
      setLoading(true);
      setError(null);

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      // For now, return base calculations plus address-based delivery fee
      // In real implementation, this would be an API call
      const deliveryFee = address?.length > 20 ? 200 : 150;
      
      return {
        ...baseCalculations,
        deliveryFee,
        total: baseCalculations.subtotal + deliveryFee + baseCalculations.deposit
      };

    } catch (err) {
      setError(err.message || 'Failed to calculate prices');
      return baseCalculations;
    } finally {
      setLoading(false);
    }
  }, [baseCalculations]);

  return {
    ...baseCalculations,
    calculatePrices,
    loading,
    error
  };
};