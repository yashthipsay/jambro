'use client'

import { useState, useEffect, useRef } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from "@fullcalendar/daygrid"
import interactionPlugin from "@fullcalendar/interaction"
import { Card, CardContent } from "./ui/card"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "./ui/tabs"
import { motion, AnimatePresence } from "framer-motion"
import { Calendar, List } from "lucide-react"
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from './ui/select'
import { Button } from './ui/button'
import { Input } from './ui/input'
import moment from 'moment-timezone'
import UserInfoModal from './ui/UserInfoModal'

export default function BookingsPage(){
    const pathname = usePathname();
    const searchParams = useSearchParams()
    const jamroom_id = pathname.split('/').pop()
    const targetBookingId = searchParams.get('bookingId')

    const [bookings, setBookings] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [filters, setFilters] = useState({
      startDate: '',
      endDate: '',
      sortBy: 'date',
      sortOrder: 'desc'
    })
    const [pagination, setPagination] = useState({
      skip: 0,
      limit: 10,
      total: 0
    })
    const [selectedBookingId, setSelectedBookingId] = useState(null)
    const [activeTab, setActiveTab] = useState('calendar')
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [userInfo, setUserInfo] = useState(null);
    const bookingRefs = useRef({})

    useEffect(() => {
        const fetchBookings = async () => {
          try {
            const queryParams = new URLSearchParams({
              ...filters,
              skip: pagination.skip,
              limit: pagination.limit
            }).toString()
            const response = await fetch(`http://localhost:5000/api/bookings/jamroom/${jamroom_id}?${queryParams}`)
            const data = await response.json()
            console.log(data)
            if (data.success) {
              console.log(data)
              // Filter out bookings with status TERMINATED
              const filteredBookings = data.data.filter(booking => booking.status !== 'TERMINATED');
              // Transform bookings into calendar events
              const events = filteredBookings.map(booking => {
                // Get earliest start time and latest end time
                const bookingDate = moment(booking.date).format('YYYY-MM-DD')
                const sortedSlots = [...booking.slots].sort((a, b) => {
                  return moment(a.startTime, 'HH:mm') - moment(b.startTime, 'HH:mm')
                })
    
                const firstSlot = sortedSlots[0]
                const lastSlot = sortedSlots[sortedSlots.length - 1]
    
                return {
                  id: booking._id,
                  title: `Booking #${booking._id.slice(-4)}`,
                  start: `${bookingDate}T${firstSlot.startTime}`,
                  end: `${bookingDate}T${lastSlot.endTime}`,
                  extendedProps: {
                    status: booking.status,
                    slots: booking.slots
                  }
                }
              })
              setBookings(events)
              setPagination(prev => ({ ...prev, total: data.total }))
            } else {
              setError(data.message)

            }
          } catch (err) {
            setError('Error fetching bookings');
            console.error(err)
          } finally {
            setLoading(false)
          }
        }
    
        fetchBookings()
      }, [jamroom_id, filters, pagination.skip, pagination.limit])

      useEffect(() => {
        if (targetBookingId && bookingRefs.current[targetBookingId]) {
            bookingRefs.current[targetBookingId].scrollIntoView({ 
                behavior: 'smooth',
                block: 'center'
            })
            setSelectedBookingId(targetBookingId)
        }
      }, [targetBookingId, bookings])

      const handleBookingClick = async (bookingId) => {
        try {
          setSelectedBookingId(bookingId); // Track which booking was clicked
          const response = await fetch(`http://localhost:5000/api/bookings/user/${bookingId}`);
          const data = await response.json();
          console.log(data)
          if (data.success) {
            setUserInfo(data.data);
            setIsModalOpen(true);
          }
        } catch (error) {
          console.error('Error fetching user data:', error);
        }
      };

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

      const renderEventContent = (eventInfo) => {
        console.log(eventInfo.event.extendedProps)
        const status = eventInfo.event.extendedProps.status
        const statusColors = {
          'NOT_STARTED': 'bg-yellow-500',
          'ONGOING': 'bg-blue-500',
          'COMPLETED': 'bg-green-500',
          'TERMINATED': 'bg-red-500'  // Add color for terminated status
        }

        return (
          <div className={`p-1 rounded ${statusColors[status]} text-white`}>
            <div className="text-sm font-semibold">{eventInfo.event.title}</div>
            <div className="text-xs">
              {moment(eventInfo.event.start).format('HH:mm')} - 
              {moment(eventInfo.event.end).format('HH:mm')}
            </div>
          </div>
        )
      }

      
      const handleEventClick = (eventInfo) => {
        const bookingId = eventInfo.event.id
        setSelectedBookingId(bookingId)
        setActiveTab('history')
        
        // Wait for tab switch animation
        setTimeout(() => {
            bookingRefs.current[bookingId]?.scrollIntoView({ 
                behavior: 'smooth',
                block: 'center'
            })
        }, 300)
    }

    const NoResults = () => (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="flex flex-col items-center justify-center p-8"
      >
        <h3 className="text-2xl font-semibold text-gray-500 mb-2">No Bookings Found</h3>
        <p className="text-gray-400">
          Try adjusting your filters to find what you're looking for
        </p>
      </motion.div>
    );

      const BookingHistory = () => (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="w-full max-w-4xl mx-auto"
        >

              {bookings.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {bookings.map((booking) => (
              <Card 
              key={booking.id}
              ref={el => bookingRefs.current[booking.id] = el}
              className={`transform transition-all ${
                  selectedBookingId === booking.id 
                  ? 'ring-2 ring-primary scale-105' 
                  : 'hover:scale-105'
              }`}
          >

                <CardContent className="glass-card p-4">
                  <div className="flex justify-between items-center">
                    <h3 className="font-semibold text-[#7DF9FF]">Booking #{booking.id.slice(-4)}</h3>
                    <span className={`px-2 py-1 rounded text-sm ${
                      booking.extendedProps.status === 'NOT_STARTED' ? 'bg-yellow-500' :
                      booking.extendedProps.status === 'ONGOING' ? 'bg-blue-500' :
                      booking.extendedProps.status === 'COMPLETED' ? 'bg-green-500' :
                      'bg-red-500' 
                    } text-white`}>
                      {booking.extendedProps.status}
                    </span>
                  </div>
                  <p className="text-sm mt-2 text-white">
                    Date: {moment(booking.start).format('MMMM D, YYYY')}
                  </p>
                  <p className="text-sm text-white">
                    Time: {moment(booking.start).format('HH:mm')} - {moment(booking.end).format('HH:mm')}
                  </p>
                  {booking.extendedProps.status === 'TERMINATED' && booking.refundDetails && (
                <p className="text-sm mt-2 text-red-400 font-medium">
                  Refunded: ₹{booking.refundDetails.amount} ({booking.refundDetails.percentage}%)
                </p>
              )}
                <Button 
    onClick={() => handleBookingClick(booking.id)} 
    className="mt-4 w-full bg-[#7DF9FF]/20 hover:bg-[#7DF9FF]/30 text-white border-[#7DF9FF]/30"
    variant="outline"
  >
    View Details
  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
              ) : (
                <NoResults />
              )}
        </motion.div>
      )
    
      if (loading) return <div>Loading...</div>
      if (error) return <div>Error: {error}</div>

      const totalPages = Math.ceil(pagination.total / pagination.limit)
      const currentPage = Math.floor(pagination.skip / pagination.limit) + 1
    
      return (
        <div className="flex-1 p-6 mt-16 pl-72 overflow-y-auto h-[calc(100vh-4rem)]">
          <div className="max-w-7xl mx-auto space-y-4">
            <h1 className="text-2xl font-bold mb-4 text-[#7DF9FF] text-shadow">Bookings</h1>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
              <Input
                name="startDate"
                type="date"
                placeholder="Start Date"
                value={filters.startDate}
                onChange={handleFilterChange}
                className="bg-black/30 border-[#7DF9FF]/30 text-white placeholder-white/70"
              />
              <Input
                name="endDate"
                type="date"
                placeholder="End Date"
                value={filters.endDate}
                onChange={handleFilterChange}
                className="bg-black/30 border-[#7DF9FF]/30 text-white placeholder-white/70"
              />
            </div>
            <div className="flex gap-4 mb-4">
              <Select
                value={filters.sortBy}
                onValueChange={(value) => handleSortChange(value, filters.sortOrder)}
              >
                <SelectTrigger className="bg-black/30 border-[#7DF9FF]/30 text-white">
                  <SelectValue placeholder="Sort By" className="text-white"/>
                </SelectTrigger>
                <SelectContent className="bg-black/80 border-[#7DF9FF]/30 text-white">
                  <SelectItem value="date" className="text-white hover:bg-[#7DF9FF]/20">Date</SelectItem>
                  <SelectItem value="totalAmount" className="text-white hover:bg-[#7DF9FF]/20">Amount</SelectItem>
                </SelectContent>
              </Select>
              <Select
                value={filters.sortOrder}
                onValueChange={(value) => handleSortChange(filters.sortBy, value)}
              >
                <SelectTrigger className="bg-black/30 border-[#7DF9FF]/30 text-white">
                  <SelectValue placeholder="Sort Order" className="text-white"/>
                </SelectTrigger>
                <SelectContent className="bg-black/80 border-[#7DF9FF]/30 text-white">
                  <SelectItem value="asc" className="text-white hover:bg-[#7DF9FF]/20">Ascending</SelectItem>
                  <SelectItem value="desc" className="text-white hover:bg-[#7DF9FF]/20">Descending</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
      <TabsList className="grid w-full grid-cols-2 mb-4 bg-black/30 text-white">
        <TabsTrigger value="calendar" className="flex items-center gap-2 text-white data-[state=active]:bg-[#7DF9FF]/30 data-[state=active]:text-white">
          <Calendar className="w-4 h-4" />
          Calendar View
        </TabsTrigger>
        <TabsTrigger value="history" className="flex items-center gap-2 text-white data-[state=active]:bg-[#7DF9FF]/30 data-[state=active]:text-white">
          <List className="w-4 h-4" />
          Booking History
        </TabsTrigger>
      </TabsList>
    
            <AnimatePresence mode="wait">
              <TabsContent value="calendar">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                >
                  <Card className="glass-card border-[#7DF9FF]/30 bg-gradient-to-b from-white/10 to-purple-500/10">
                    <CardContent className="p-2 sm:p-4">
                    {bookings.length > 0 ? (
                      <FullCalendar
                        plugins={[dayGridPlugin, interactionPlugin]}
                        initialView="dayGridMonth"
                        events={bookings}
                        eventContent={renderEventContent}
                        headerToolbar={{
                          left: 'prev,next today',
                          center: 'title',
                          right: 'dayGridMonth,dayGridWeek,dayGridDay'
                        }}
                        eventClick={handleEventClick}
                        eventClassNames="cursor-pointer hover:opacity-75"
                        height="auto"
                      />
                    ) : (
                      <NoResults />
                    )}

                    </CardContent>
                  </Card>

                </motion.div>
              </TabsContent>
    
              <TabsContent value="history">

                <BookingHistory />
              </TabsContent>
            </AnimatePresence>
          </Tabs>
          {bookings.length > 0 && (
      <div className="flex justify-between items-center mt-6">
        <Button
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 1}
           className="bg-[#7DF9FF]/20 hover:bg-[#7DF9FF]/40 text-white border-[#7DF9FF]/30"
        >
          Previous
        </Button>
        <span className="text-[#7DF9FF] font-medium">Page {currentPage} of {totalPages}</span>
        <Button
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="bg-[#7DF9FF]/20 hover:bg-[#7DF9FF]/40 text-white border-[#7DF9FF]/30 px-6 py-2"
        >
          Next
        </Button>

        
      </div>
    )}
    <UserInfoModal 
      isOpen={isModalOpen} 
      onClose={() => {
        setIsModalOpen(false);
        setSelectedBookingId(null);
        setUserInfo(null);
      }} 
      userInfo={userInfo} 
    />
  </div>
      )
    }
