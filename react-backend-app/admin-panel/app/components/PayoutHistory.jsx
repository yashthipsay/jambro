'use client';
import { usePathname, useSearchParams, useRouter } from 'next/navigation';
import { useDashboard } from '../context/DashboardContext';
import { useState, useEffect } from 'react';
import { Card, CardHeader, CardContent } from './ui/card';
import { motion } from 'framer-motion';
import { Button } from './ui/button';
import { Input } from './ui/input';
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from './ui/select';

const PayoutHistory = () => {
  const { jamRoomId } = useDashboard(); 
  const router = useRouter();

  const [payouts, setPayouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    minAmount: '',
    maxAmount: '',
    startDate: '',
    endDate: '',
    sortBy: 'createdAt',
    sortOrder: 'desc',
  });
  const [pagination, setPagination] = useState({
    skip: 0,
    limit: 10,
    total: 0,
  });



  const NoResults = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="flex flex-col items-center justify-center p-8"
    >
      <h3 className="text-2xl font-semibold text-gray-500 mb-2">
        No Results Found
      </h3>
      <p className="text-gray-400">
        Try adjusting your filters to find what you're looking for
      </p>
    </motion.div>
  );

  useEffect(() => {
    if (!jamRoomId || jamRoomId === "null") {
      setLoading(false);
      return;
    }

    const fetchPayouts = async () => {
      try {
        const queryParams = new URLSearchParams({
          ...filters,
          skip: pagination.skip,
          limit: pagination.limit,
        }).toString();
        const response = await fetch(
          `http://localhost:5000/api/payouts/${jamRoomId}?${queryParams}`
        );
        const data = await response.json();
        console.log("Payouts: ", data);

        if (data.success) {
          setPayouts(data.data);
          setPagination((prev) => ({ ...prev, total: data.total }));
          setError(null); // Clear any existing errors
        } else {
          setError(data.message);
        }
      } catch (err) {
        setError('Error fetching payouts');
      } finally {
        setLoading(false);
      }
    };

    fetchPayouts();
  }, [jamRoomId, filters, pagination.skip, pagination.limit]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prevFilters) => ({ ...prevFilters, [name]: value }));
  };

  const handleSortChange = (sortBy, sortOrder) => {
    setFilters((prevFilters) => ({ ...prevFilters, sortBy, sortOrder }));
  };

  const handlePageChange = (newPage) => {
    setPagination((prev) => ({ ...prev, skip: (newPage - 1) * prev.limit }));
  };

  if (loading) {
    if (loading) {
      return (
        <div className="flex items-center justify-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      );
    }
  }

  if (error) {
    return (
      <div className="flex items-center justify-center p-8 text-red-500">
        <span>{error}</span>
      </div>
    );
  }

  const totalPages = Math.ceil(pagination.total / pagination.limit);
  const currentPage = Math.floor(pagination.skip / pagination.limit) + 1;

  return (
    <div className="flex-1 p-4 sm:p-6 mt-16 sm:ml-64 overflow-y-auto h-[calc(100vh-4rem)]">
      <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6 pb-32 sm:pb-20">
        <div className="z-10 backdrop-blur-sm pb-4">
          <h1 className="text-2xl sm:text-3xl font-audiowide text-[#7DF9FF] mb-4 sm:mb-6">
            Payout History
          </h1>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-3 sm:mb-4">
            <Input
              name="minAmount"
              placeholder="Min Amount"
              value={filters.minAmount}
              onChange={handleFilterChange}
              className="glassmorphism bg-black/30 border-[#7DF9FF]/30 text-white placeholder-white/70"
            />
            <Input
              name="maxAmount"
              placeholder="Max Amount"
              value={filters.maxAmount}
              onChange={handleFilterChange}
              className="glassmorphism bg-black/30 border-[#7DF9FF]/30 text-white placeholder-white/70"
            />
            <Input
              name="startDate"
              type="date"
              placeholder="Start Date"
              value={filters.startDate}
              onChange={handleFilterChange}
              className="glassmorphism bg-black/30 border-[#7DF9FF]/30 text-white placeholder-white/70"
            />
            <Input
              name="endDate"
              type="date"
              placeholder="End Date"
              value={filters.endDate}
              onChange={handleFilterChange}
              className="glassmorphism bg-black/30 border-[#7DF9FF]/30 text-white placeholder-white/70"
            />
          </div>
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-3 sm:mb-4">
            <Select
              value={filters.sortBy}
              onValueChange={(value) =>
                handleSortChange(value, filters.sortOrder)
              }
            >
              <SelectTrigger className="bg-black/40 border-[#7DF9FF]/20 text-[#7DF9FF]">
                <SelectValue placeholder="Sort By" className="text-white" />
              </SelectTrigger>
              <SelectContent className="bg-black/80 border-[#7DF9FF]/30 text-white">
                <SelectItem
                  value="createdAt"
                  className="text-white hover:bg-[#7DF9FF]/20"
                >
                  Date
                </SelectItem>
                <SelectItem
                  value="amount"
                  className="text-white hover:bg-[#7DF9FF]/20"
                >
                  Amount
                </SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={filters.sortOrder}
              onValueChange={(value) => handleSortChange(filters.sortBy, value)}
            >
              <SelectTrigger className="bg-black/40 border-[#7DF9FF]/20 text-[#7DF9FF]">
                <SelectValue placeholder="Sort Order" className="text-white" />
              </SelectTrigger>
              <SelectContent className="bg-black/80 border-[#7DF9FF]/30 text-white">
                <SelectItem
                  value="asc"
                  className="text-white hover:bg-[#7DF9FF]/20"
                >
                  Ascending
                </SelectItem>
                <SelectItem
                  value="desc"
                  className="text-white hover:bg-[#7DF9FF]/20"
                >
                  Descending
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        {payouts.length > 0 ? (
          <div className="grid gap-3 sm:gap-4">
            {payouts.map((payout) => (
              <motion.div
                key={payout._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <Card className="glass-card bg-gradient-to-b from-white/10 to-purple-500/10 border-[#7DF9FF]/20">
                  <CardHeader className="p-3 sm:p-4">
                    <h3 className="text-base sm:text-lg font-audiowide text-[#7DF9FF] break-all">
                      Payout ID: {payout.razorpayPayoutId || payout._id}
                    </h3>
                  </CardHeader>
                  <CardContent className="p-3 sm:p-4 pt-0 sm:pt-0 space-y-2">
                    <p className="text-sm sm:text-base text-[#7DF9FF]/80">
                      Amount: ₹{payout.amount}
                    </p>
                    <p className="text-sm sm:text-base text-[#7DF9FF]/80">
                      Status: {payout.status}
                    </p>
                    <p className="text-sm sm:text-base text-[#7DF9FF]/80">
                      Beneficiary: {payout.beneficiaryName}
                    </p>
                    {payout.upiId && (
                      <p className="text-sm sm:text-base text-[#7DF9FF]/80">
                        UPI ID: {payout.upiId}
                      </p>
                    )}
                    <p className="text-sm sm:text-base text-[#7DF9FF]/80">
                      Transaction ID: {payout.bulkpeTransactionId || 'N/A'}
                    </p>
                    <p className="text-sm sm:text-base text-[#7DF9FF]/80">
                      Date: {new Date(payout.createdAt).toLocaleDateString()}
                    </p>
                    <Button
                      onClick={() => router.push(`/bookings/${jamRoomId}?bookingId=${payout.bookingId}`)}
                      variant="outline"
                      className="w-full sm:w-auto mt-2 bg-gradient-to-r from-[#7DF9FF]/20 to-[#00BFFF]/40 hover:from-[#7DF9FF]/40 hover:to-[#00BFFF]/60 text-[#7DF9FF] border-[#7DF9FF]/30"
                    >
                      View Booking
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        ) : (
          <NoResults />
        )}

        {payouts.length > 0 && (
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mt-6">
            <Button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="w-full sm:w-auto bg-[#7DF9FF]/20 hover:bg-[#7DF9FF]/40 text-white border-[#7DF9FF]/30"
            >
              Previous
            </Button>
            <span className="text-sm sm:text-base text-[#7DF9FF] font-medium order-first sm:order-none">
              Page {currentPage} of {totalPages}
            </span>
            <Button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="w-full sm:w-auto bg-[#7DF9FF]/20 hover:bg-[#7DF9FF]/40 text-white border-[#7DF9FF]/30"
            >
              Next
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default PayoutHistory;
