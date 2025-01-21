import { usePathname, useSearchParams } from 'next/navigation'
import { useState, useEffect } from 'react'
import { Card, CardHeader, CardContent } from "@/components/ui/card"
import { motion } from 'framer-motion'

const PayoutHistory = () => {
  const pathname = usePathname()
  const fund_account_id = pathname.split('/').pop() // Get last segment of URL

  const [payouts, setPayouts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchPayouts = async () => {
      try {
        const response = await fetch(`http://localhost:5000/api/payouts/${fund_account_id}`)
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
  }, [fund_account_id])

  if (loading) {
    return <div>Loading...</div>
  }

  if (error) {
    return <div className="text-red-500">{error}</div>
  }

  return (
    <div className="grid gap-4 p-4">
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
  )
}

export default PayoutHistory