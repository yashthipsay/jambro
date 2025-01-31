import { usePathname, useSearchParams } from 'next/navigation'
import { useState, useEffect } from 'react'
import { Card, CardHeader, CardContent } from "./ui/card"
import { motion } from 'framer-motion'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from './ui/select'



const PayoutHistory = () => {
  const pathname = usePathname()
  const fund_account_id = pathname.split('/').pop() // Get last segment of URL

  const [payouts, setPayouts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [filters, setFilters] = useState({
    minAmount: '',
    maxAmount: '',
    startDate: '',
    endDate: '',
    sortBy: 'createdAt',
    sortOrder: 'desc'
  })
  const [pagination, setPagination] = useState({
    skip: 0,
    limit: 10,
    total: 0
  })

  const NoResults = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="flex flex-col items-center justify-center p-8"
    >
      <h3 className="text-2xl font-semibold text-gray-500 mb-2">No Results Found</h3>
      <p className="text-gray-400">
        Try adjusting your filters to find what you're looking for
      </p>
    </motion.div>
  );

  useEffect(() => {
    const fetchPayouts = async () => {
      try {
        
        const queryParams = new URLSearchParams({
          ...filters,
          skip: pagination.skip,
          limit: pagination.limit
        }).toString()
        const response = await fetch(`http://13.126.198.106:5000/api/payouts/${fund_account_id}?${queryParams}`)
        const data = await response.json()

        if (data.success) {
          setPayouts(data.data)
          setPagination(prev => ({ ...prev, total: data.total }))
          setError(null); // Clear any existing errors
        } else {
          setError(data.message)
        }
      } catch (err) {
        setError('Error fetching payouts')
      } finally {
        setLoading(false)
      }
    }

    fetchPayouts()
  }, [fund_account_id, filters, pagination.skip, pagination.limit])

  const handleFilterChange = (e) => {
    const { name, value } = e.target
    setFilters(prevFilters => ({ ...prevFilters, [name]: value }))
  }

  const handleSortChange = (sortBy, sortOrder) => {
    setFilters(prevFilters => ({ ...prevFilters, sortBy, sortOrder }))
  }

  const handlePageChange = (newPage) => {
    setPagination(prev => ({ ...prev, skip: (newPage - 1) * prev.limit }))
  }

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

  const totalPages = Math.ceil(pagination.total / pagination.limit)
  const currentPage = Math.floor(pagination.skip / pagination.limit) + 1

  return (
    <div className="p-4">
      <div className="mb-4">
        <h1 className="text-2xl font-bold mb-4 gradient-text">Payout History</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          <Input
            name="minAmount"
            placeholder="Min Amount"
            value={filters.minAmount}
            onChange={handleFilterChange}
            className="bg-card text-card-foreground"
          />
          <Input
            name="maxAmount"
            placeholder="Max Amount"
            value={filters.maxAmount}
            onChange={handleFilterChange}
            className="bg-card text-card-foreground"
          />
          <Input
            name="startDate"
            type="date"
            placeholder="Start Date"
            value={filters.startDate}
            onChange={handleFilterChange}
            className="bg-card text-card-foreground"
          />
          <Input
            name="endDate"
            type="date"
            placeholder="End Date"
            value={filters.endDate}
            onChange={handleFilterChange}
            className="bg-card text-card-foreground"
          />
        </div>
        <div className="flex gap-4 mb-4">
          <Select
            value={filters.sortBy}
            onValueChange={(value) => handleSortChange(value, filters.sortOrder)}
          >
            <SelectTrigger className="bg-card text-card-foreground">
              <SelectValue placeholder="Sort By" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="createdAt">Date</SelectItem>
              <SelectItem value="amount">Amount</SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={filters.sortOrder}
            onValueChange={(value) => handleSortChange(filters.sortBy, value)}
          >
            <SelectTrigger className="bg-card text-card-foreground">
              <SelectValue placeholder="Sort Order" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="asc">Ascending</SelectItem>
              <SelectItem value="desc">Descending</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      {payouts.length > 0 ? (
      <div className="grid gap-4">
        {payouts.map((payout) => (
          <motion.div
            key={payout._id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Card className="bg-card text-card-foreground">
              <CardHeader>
                <h3 className="text-lg font-semibold">Payout ID: {payout._id}</h3>
              </CardHeader>
              <CardContent>
                <p className="text-sm">Amount: ₹{payout.amount}</p>
                <p className="text-sm">Status: {payout.status}</p>
                <p className="text-sm">Date: {new Date(payout.createdAt).toLocaleDateString()}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
      ) : (
        <NoResults />
      )}
      
      {payouts.length > 0 && (
        <div className="flex justify-between items-center mt-4">
          <Button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
          >
            Previous
          </Button>
          <span>Page {currentPage} of {totalPages}</span>
          <Button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="btn-primary"
          >
            Next
          </Button>
        </div>
      )}
    </div>
    
  )
}

export default PayoutHistory