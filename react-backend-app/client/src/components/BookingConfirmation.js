"use client"

import { useState, useEffect, useRef } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { CheckCircle, Download, AlertCircle, Calendar, Clock, MapPin, CreditCard } from "lucide-react"
import { Button, Divider, Paper, Typography, Box } from "@mui/material"
import html2canvas from "html2canvas"
import {Chip} from "@mui/material"

import { useAPI } from "../utils/apiFetcher"

// Local cache keys for this component
const INVOICE_CACHE_KEYS = {
  INVOICE: (id) => `/payments/invoice-data/${id}`,
};



const BookingConfirmation = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [error, setError] = useState(null)
  const invoiceRef = useRef(null)

  // SWR: fetch and cache invoice data
  const {
    data: invoiceResponse,
    isLoading: invoiceLoading,
    error: fetchError,
  } = useAPI(
    id ? INVOICE_CACHE_KEYS.INVOICE(id) : null,
    {
      revalidateOnFocus: false,
      dedupingInterval: 60000, // cache for 1 minute
    }
  );

  const invoiceData = invoiceResponse?.invoice || null;
  const displayError = error || (fetchError ? (fetchError.info?.message || "Failed to fetch invoice") : null);

    // Add mobile back navigation handler so that a native back event goes directly to home
    useEffect(() => {
      // On mount, push a custom history state if not already present.
      if (!window.history.state || window.history.state.page !== "booking-confirmation") {
        window.history.pushState({ page: "booking-confirmation" }, document.title, window.location.href)
      }
  
      const handlePopState = (e) => {
        e.preventDefault()
        navigate("/", { replace: true })
      }
  
      window.addEventListener("popstate", handlePopState)
      return () => window.removeEventListener("popstate", handlePopState)
    }, [navigate])

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
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-indigo-100 p-4 flex flex-col items-center justify-center"
      style={{
        backgroundColor: "#f8f6ff",
        backgroundImage: `radial-gradient(circle at 50% 0%, #e9e4ff 0%, #f8f6ff 70%)`,
      }}
    >
      <div className="w-full max-w-2xl bg-white rounded-xl shadow-lg p-6">
        {invoiceLoading ? (
          <div className="flex flex-col items-center justify-center py-8">
            <div className="w-12 h-12 border-4 border-t-indigo-600 border-indigo-200 rounded-full animate-spin"></div>
            <p className="mt-4 text-gray-600">Loading your confirmation...</p>
          </div>
        ) : displayError ? (
          <div className="flex flex-col items-center text-center py-6">
            <AlertCircle className="w-16 h-16 text-red-500 mb-4" />
            <h2 className="text-xl font-bold text-gray-800">Something went wrong</h2>
            <p className="mt-2 text-gray-600">{displayError}</p>
            <Button variant="contained" color="primary" className="mt-4" onClick={() => window.location.reload()}>
              Try Again
            </Button>
          </div>
        ) : (
          <>
            <div className="flex flex-col items-center text-center mb-6">
              <CheckCircle className="w-16 h-16 text-green-500 mb-3" />
              <h1 className="text-2xl font-bold text-gray-900">Booking Confirmed</h1>
              <div className="mt-2 px-3 py-1.5 bg-gray-100 rounded-full">
                <p className="text-xs text-gray-600">Booking ID</p>
                <p className="font-mono text-sm font-semibold text-indigo-700 tracking-wide">{id}</p>
              </div>
            </div>

            {/* Invoice Display - add ref to capture */}
            {invoiceData && (
              <Paper
                elevation={0}
                variant="outlined"
                className="p-0 overflow-hidden rounded-2xl border border-indigo-100 shadow-sm"
                ref={invoiceRef}
              >
                {/* Top bar */}
                <div className="h-1 w-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />

                {/* Header */}
                <div className="p-5 sm:p-6 flex items-center justify-between bg-white">
                  <div className="flex items-center gap-3">
                    <img src="/gigsaw_ss.png" alt="GigSaw" className="h-8 w-8 rounded" />
                    <div>
                      <Typography variant="h6" className="font-bold leading-tight">
                        GigSaw
                      </Typography>
                      <Typography variant="caption" className="text-gray-500">
                        Invoice #{invoiceData.invoiceNumber}
                      </Typography>
                    </div>
                  </div>
                  <div className="text-right">
                    <Chip
                      label="Paid"
                      color="success"
                      size="small"
                      className="font-semibold"
                    />
                    <div className="mt-1 text-xs text-gray-500">
                      {new Date(invoiceData.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>

                <Divider />
                
                {/* Parties */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 p-5 sm:p-6 bg-white">
                  <div className="rounded-xl border border-gray-100 p-4">
                    <Typography variant="subtitle2" className="text-gray-500 mb-1">
                      Customer
                    </Typography>
                    <Typography variant="body1" className="font-medium">{invoiceData.customerName}</Typography>
                    <Typography variant="body2" className="text-gray-600">{invoiceData.customerEmail}</Typography>
                    <Typography variant="body2" className="text-gray-600">{invoiceData.customerPhone}</Typography>
                  </div>
                  <div className="rounded-xl border border-gray-100 p-4">
                    <Typography variant="subtitle2" className="text-gray-500 mb-1">
                      Jam Room
                    </Typography>
                    <Typography variant="body1" className="font-medium">{invoiceData.jamRoomName}</Typography>
                    <div className="flex items-start gap-2 mt-1 text-gray-600">
                      <MapPin className="w-4 h-4 mt-0.5 text-gray-500" />
                      <Typography variant="body2">{invoiceData.jamRoomLocation}</Typography>
                    </div>
                  </div>
                </div>
                
                {/* Schedule */}
                <div className="px-5 sm:px-6 pb-4">
                  <Box className="bg-indigo-50/60 border border-indigo-100 rounded-xl p-4">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-indigo-600" />
                        <Typography variant="body2" className="text-gray-800">
                          {new Date(invoiceData.bookingDate).toLocaleDateString()}
                        </Typography>
                      </div>
                      <div className="flex items-start gap-2">
                        <Clock className="w-4 h-4 text-indigo-600 mt-0.5" />
                        <Typography variant="body2" className="text-gray-800">
                          {invoiceData.slots?.map(s => `${s.startTime} - ${s.endTime}`).join(", ")}
                        </Typography>
                      </div>
                    </div>
                  </Box>
                </div>
                
                
                {/* Charges */}
                <div className="px-5 sm:px-6 py-4">
                  <Typography variant="subtitle2" className="text-gray-600 mb-2">
                    Summary
                  </Typography>
                  <div className="rounded-xl border border-gray-100 bg-white">
                    <div className="flex items-center justify-between px-4 py-3">
                      <span className="text-gray-700">Jam Room Fee</span>
                      <span className="font-medium">₹{invoiceData.jamRoomFee}</span>
                    </div>
                    {invoiceData.addons && invoiceData.addons.length > 0 && (
                      <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
                        <span className="text-gray-700">Add-ons</span>
                        <span className="font-medium">₹{invoiceData.addonsFee}</span>
                      </div>
                    )}
                    {invoiceData.service && (
                      <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
                        <div className="text-gray-700">
                          <div className="font-medium">{invoiceData.service.name}</div>
                          <div className="text-xs text-gray-500">{invoiceData.service.subPart.name}</div>
                        </div>
                        <span className="font-medium">₹{invoiceData.service.subPart.price}</span>
                      </div>
                    )}
                    {invoiceData.taxAmount > 0 && (
                      <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
                        <span className="text-gray-700">Tax</span>
                        <span className="font-medium">₹{invoiceData.taxAmount}</span>
                      </div>
                    )}
                    <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 bg-indigo-50/60 rounded-b-xl">
                      <span className="font-semibold text-gray-900">Total</span>
                      <span className="font-bold text-indigo-700">₹{invoiceData.totalAmount}</span>
                    </div>
                  </div>
                </div>

                {/* Payment */}
                <div className="px-5 sm:px-6 pb-6">
                  <div className="mt-2 bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
                      <CreditCard className="w-4 h-4 text-green-600" />
                    </div>
                    <div>
                      <Typography variant="body2" className="text-green-700">
                        Paid with {invoiceData.paymentMethod}
                      </Typography>
                      <Typography variant="caption" className="text-green-600">
                        Transaction ID: {invoiceData.paymentId}
                      </Typography>
                    </div>
                  </div>

                  <div className="mt-6 pt-4 border-t text-center">
                    <Typography variant="caption" className="text-gray-500">
                      Thank you for booking with GigSaw! For support, contact gigsawservices@.com
                    </Typography>
                  </div>
                </div>
              </Paper>
            )}

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3 mt-6">
              <Button
                variant="outlined"
                color="primary"
                fullWidth
                onClick={() => (window.location.href = "/")}
              >
                Back to Home
              </Button>
              <Button
                variant="contained"
                color="primary"
                fullWidth
                startIcon={<Download />}
                onClick={handleDownloadScreenshot}
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