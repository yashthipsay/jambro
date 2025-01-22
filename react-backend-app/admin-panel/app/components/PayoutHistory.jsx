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

  useEffect(() => {
    const fetchPayouts = async () => {
      try {
        const queryParams = new URLSearchParams(filters).toString()
        const response = await fetch(`http://localhost:5000/api/payouts/${fund_account_id}?${queryParams}`)
        const data = await response.json()

        if (data.success) {
          setPayouts(data.data)
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
  }, [fund_account_id, filters])

  const handleFilterChange = (e) => {
    const { name, value } = e.target
    setFilters(prevFilters => ({ ...prevFilters, [name]: value }))
  }

  const handleSortChange = (sortBy, sortOrder) => {
    setFilters(prevFilters => ({ ...prevFilters, sortBy, sortOrder }))
  }

  if (loading) {
    return <div>Loading...</div>
  }

  if (error) {
    return <div className="text-red-500">{error}</div>
  }

  return (
    <div className="p-4">
      <div className="mb-4">
        <h1 className="text-2xl font-bold mb-4">Payout History</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          <Input
            name="minAmount"
            placeholder="Min Amount"
            value={filters.minAmount}
            onChange={handleFilterChange}
          />
          <Input
            name="maxAmount"
            placeholder="Max Amount"
            value={filters.maxAmount}
            onChange={handleFilterChange}
          />
          <Input
            name="startDate"
            type="date"
            placeholder="Start Date"
            value={filters.startDate}
            onChange={handleFilterChange}
          />
          <Input
            name="endDate"
            type="date"
            placeholder="End Date"
            value={filters.endDate}
            onChange={handleFilterChange}
          />
        </div>
        <div className="flex gap-4 mb-4">
          <Select
            value={filters.sortBy}
            onValueChange={(value) => handleSortChange(value, filters.sortOrder)}
          >
            <SelectTrigger>
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
            <SelectTrigger>
              <SelectValue placeholder="Sort Order" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="asc">Ascending</SelectItem>
              <SelectItem value="desc">Descending</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="grid gap-4">
        {payouts.map((payout) => (
          <motion.div
            key={payout._id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Card>
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
    </div>
  )
}

export default PayoutHistory