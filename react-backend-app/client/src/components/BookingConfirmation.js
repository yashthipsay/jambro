"use client"

import { useState, useEffect, useRef } from "react"
import { useParams } from "react-router-dom"
import { CheckCircle, Download, AlertCircle, Calendar, Clock, MapPin, CreditCard } from "lucide-react"
import { Button, Divider, Paper, Typography, Box } from "@mui/material"
import html2canvas from "html2canvas"

const BookingConfirmation = () => {
  const { id } = useParams()
  const [invoiceData, setInvoiceData] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const invoiceRef = useRef(null)

  useEffect(() => {
    const fetchInvoiceData = async () => {
      setIsLoading(true)
      try {
        const response = await fetch(`http://localhost:5000/api/payments/invoice-data/${id}`)
        const data = await response.json()
        
        if (data.success) {
          setInvoiceData(data.invoice)
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

    fetchInvoiceData()
  }, [id])

  // New screenshot download function
  const handleDownloadScreenshot = async () => {
    try {
      // Show a "preparing download" message or spinner here if needed
      
      if (invoiceRef.current) {
        // Create a canvas from the invoice element
        const canvas = await html2canvas(invoiceRef.current, { 
          scale: 2, // Higher scale for better quality
          backgroundColor: "#ffffff",
          logging: false,
          useCORS: true // Enable if you have images from external sources
        })
        
        // Convert the canvas to a data URL
        const imageData = canvas.toDataURL("image/png")
        
        // Create a download link and trigger it
        const link = document.createElement("a")
        link.href = imageData
        link.download = `invoice-${id}.png`
        link.click()
      }
    } catch (error) {
      console.error("Error downloading screenshot:", error)
      setError("Failed to download invoice screenshot. Please try again.")
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-indigo-100 p-4 flex flex-col items-center justify-center">
      <div className="w-full max-w-2xl bg-white rounded-xl shadow-lg p-6">
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
            <div className="flex flex-col items-center text-center mb-6">
              <CheckCircle className="w-20 h-20 text-green-500 mb-4" />
              <h1 className="text-2xl font-bold text-gray-800">Booking Confirmed!</h1>
              <div className="mt-2 px-4 py-2 bg-gray-100 rounded-lg">
                <p className="text-gray-700">Your booking ID:</p>
                <p className="font-mono font-medium text-indigo-700">{id}</p>
              </div>
            </div>

            {/* Invoice Display - add ref to capture */}
            {invoiceData && (
              <Paper 
                elevation={0} 
                variant="outlined" 
                className="p-6 mt-6" 
                ref={invoiceRef} // Add this reference
              >
                {/* Add a nice header with logo */}
                <div className="flex justify-between items-center mb-4">
                  <div className="flex items-center">
                    <img 
                      src="/gigsaw_ss.png" 
                      alt="GigSaw Logo" 
                      className="h-8 mr-2" 
                    />
                    <Typography variant="h6" className="font-bold">
                      GigSaw
                    </Typography>
                  </div>
                  <div className="bg-indigo-100 text-indigo-800 px-3 py-1 rounded-full text-sm font-medium">
                    Confirmed
                  </div>
                </div>
                
                <div className="flex justify-between items-start">
                  <div>
                    <Typography variant="h5" className="font-bold text-gray-800">INVOICE</Typography>
                    <Typography variant="body2" className="text-gray-600 mt-1">#{invoiceData.invoiceNumber}</Typography>
                  </div>
                  <div className="text-right">
                    <Typography variant="body2" className="text-gray-600">Date:</Typography>
                    <Typography variant="body1">{new Date(invoiceData.createdAt).toLocaleDateString()}</Typography>
                  </div>
                </div>
                
                <Divider className="my-4" />
                
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <Typography variant="subtitle2" className="text-gray-600">Customer</Typography>
                    <Typography variant="body1">{invoiceData.customerName}</Typography>
                    <Typography variant="body2" className="text-gray-600">{invoiceData.customerEmail}</Typography>
                    <Typography variant="body2" className="text-gray-600">{invoiceData.customerPhone}</Typography>
                  </div>
                  <div>
                    <Typography variant="subtitle2" className="text-gray-600">Jam Room</Typography>
                    <Typography variant="body1">{invoiceData.jamRoomName}</Typography>
                    <div className="flex items-center mt-1">
                      <MapPin className="w-4 h-4 text-gray-500 mr-1" />
                      <Typography variant="body2" className="text-gray-600">{invoiceData.jamRoomLocation}</Typography>
                    </div>
                  </div>
                </div>
                
                <Box className="bg-gray-50 rounded-lg p-4 my-4">
                  <div className="flex items-center mb-2">
                    <Calendar className="w-4 h-4 text-gray-600 mr-2" />
                    <Typography variant="body1">
                      {new Date(invoiceData.bookingDate).toLocaleDateString()}
                    </Typography>
                  </div>
                  
                  <div className="flex items-center">
                    <Clock className="w-4 h-4 text-gray-600 mr-2" />
                    <Typography variant="body1">
                      {invoiceData.slots?.map(slot => `${slot.startTime} - ${slot.endTime}`).join(', ')}
                    </Typography>
                  </div>
                </Box>
                
                <div className="mt-4">
                  <Typography variant="subtitle1" className="font-semibold">Booking Details</Typography>
                  
                  <div className="mt-2 space-y-1">
                    <div className="flex justify-between">
                      <Typography variant="body2">Jam Room Fee</Typography>
                      <Typography variant="body2">₹{invoiceData.jamRoomFee}</Typography>
                    </div>
                    
                    {invoiceData.addons && invoiceData.addons.length > 0 && (
                      <div className="flex justify-between">
                        <Typography variant="body2">Add-ons</Typography>
                        <Typography variant="body2">₹{invoiceData.addonsFee}</Typography>
                      </div>
                    )}
                    
                        {/* Studio Services Section */}
                          {invoiceData.service && (
                            <div className="flex justify-between items-center py-1">
                              <div>
                                <Typography variant="body2" className="text-gray-600">
                                  {invoiceData.service.name}
                                </Typography>
                                <Typography variant="caption" className="text-gray-500">
                                  {invoiceData.service.subPart.name}
                                </Typography>
                              </div>
                              <Typography variant="body2" className="font-medium">
                                ₹{invoiceData.service.subPart.price}
                              </Typography>
                            </div>
                          )}
                    
                    {invoiceData.taxAmount > 0 && (
                      <div className="flex justify-between">
                        <Typography variant="body2">Tax</Typography>
                        <Typography variant="body2">₹{invoiceData.taxAmount}</Typography>
                      </div>
                    )}
                  </div>
                </div>
                
                <Divider className="my-4" />
                
                <div className="flex justify-between items-center">
                  <Typography variant="subtitle1" className="font-semibold">Total Amount</Typography>
                  <Typography variant="h6" className="font-bold text-indigo-700">₹{invoiceData.totalAmount}</Typography>
                </div>
                
                <div className="mt-4 bg-green-50 border border-green-200 rounded-lg p-3 flex items-center">
                  <CreditCard className="w-5 h-5 text-green-500 mr-2" />
                  <div>
                    <Typography variant="body2" className="text-green-700">Paid with {invoiceData.paymentMethod}</Typography>
                    <Typography variant="caption" className="text-green-600">Transaction ID: {invoiceData.paymentId}</Typography>
                  </div>
                </div>
                
                {/* Footer with QR code placeholder */}
                <div className="mt-6 pt-4 border-t text-center">
                  <Typography variant="caption" className="text-gray-500">
                    Thank you for booking with GigSaw! For support, contact gigsawservices@.com
                  </Typography>
                </div>
              </Paper>
            )}
            
            <div className="flex justify-between mt-6">
              <Button variant="outlined" color="primary" onClick={() => window.location.href = "/"}>
                Back to Home
              </Button>
              <Button 
                variant="contained" 
                color="primary" 
                startIcon={<Download />}
                onClick={handleDownloadScreenshot} // Change to the new handler
              >
                Download Receipt
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default BookingConfirmation