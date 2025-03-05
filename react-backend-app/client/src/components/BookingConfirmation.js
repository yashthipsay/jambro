"use client"

import { useState, useEffect } from "react"
import { useParams } from "react-router-dom"
import { CheckCircle, Download, AlertCircle } from "lucide-react"
import { Button } from "@mui/material"

const BookingConfirmation = () => {
  const { id } = useParams()
  const [downloaded, setDownloaded] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchInvoice = async () => {
      setIsLoading(true)
      try {
        const response = await fetch(`http://localhost:5000/api/payments/invoices/${id}`)
        const data = await response.json()
        if (data.success && !downloaded) {
          const link = document.createElement("a")
          link.href = `data:application/pdf;base64,${data.pdfBuffer}`
          link.download = "invoice.pdf"
          link.click()
          setDownloaded(true)
        } else {
          setError("Failed to fetch invoice")
        }
      } catch (error) {
        console.error("Error fetching invoice:", error)
        setError("Error fetching invoice. Please try again.")
      } finally {
        setIsLoading(false)
      }
    }

    fetchInvoice()
  }, [id, downloaded])

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-indigo-100 p-4 flex flex-col items-center justify-center">
      <div className="w-full max-w-md bg-white rounded-xl shadow-lg p-6 space-y-6">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-8">
            <div className="w-12 h-12 border-4 border-t-indigo-600 border-indigo-200 rounded-full animate-spin"></div>
            <p className="mt-4 text-gray-600">Loading your confirmation...</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center text-center py-6">
            <AlertCircle className="w-16 h-16 text-red-500 mb-4" />
            <h2 className="text-xl font-bold text-gray-800">Something went wrong</h2>
            <p className="mt-2 text-gray-600">{error}</p>
            <Button variant="contained" color="primary" className="mt-4" onClick={() => window.location.reload()}>
              Try Again
            </Button>
          </div>
        ) : (
          <>
            <div className="flex flex-col items-center text-center">
              <CheckCircle className="w-20 h-20 text-green-500 mb-4" />
              <h1 className="text-2xl font-bold text-gray-800">Booking Confirmed!</h1>
              <div className="mt-2 px-4 py-2 bg-gray-100 rounded-lg">
                <p className="text-gray-700">Your booking ID:</p>
                <p className="font-mono font-medium text-indigo-700">{id}</p>
              </div>
            </div>

            <div className="pt-4 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-600">Invoice</p>
                <div className="flex items-center">
                  <Download className="w-4 h-4 mr-1 text-indigo-600" />
                  <span className="text-sm text-indigo-600">{downloaded ? "Downloaded" : "Downloading..."}</span>
                </div>
              </div>
            </div>

            <Button variant="outlined" color="primary" fullWidth onClick={() => (window.location.href = "/")}>
              Back to Home
            </Button>
          </>
        )}
      </div>
    </div>
  )
}

export default BookingConfirmation

