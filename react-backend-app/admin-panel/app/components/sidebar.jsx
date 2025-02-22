'use client'

import { motion } from 'framer-motion'
import { Button } from './ui/button'
import { Home, Receipt, Wallet, Music, UserCircle } from 'lucide-react'
import { useUser } from '@auth0/nextjs-auth0/client'
import Link from 'next/link'
import { useDashboard } from '../context/DashboardContext'

export function Sidebar() {
  const { user } = useUser()
  const { isRegistered, jamRoomId, fundAccountId, loading } = useDashboard()

  const sidebarItems = [
    { icon: Home, label: 'Dashboard', path: '/' },
    { icon: Receipt, label: 'Booking History', path: `/bookings/${jamRoomId}` },
    { icon: Wallet, label: 'Payout History', path: `/payouts/${fundAccountId}` },
    { icon: UserCircle, label: 'Profile', path: `/profile/${jamRoomId}` },
    { icon: Music, label: 'Personal Branding', path: '/branding' },
  ]

  if (loading) {
    return (
      <motion.div
        className="sticky top-0 w-64 h-[calc(100vh-5rem)] overflow-y-auto glassmorphism p-4 ml-4"
        initial={{ x: -100 }}
        animate={{ x: 0 }}
        transition={{ type: 'spring', stiffness: 120 }}
      >
        <div className="flex flex-col gap-6 animate-pulse">
          {[...Array(5)].map((_, index) => (
            <div key={index} className="h-12 bg-white/10 rounded" />
          ))}
        </div>
      </motion.div>
    )
  }

  return (
    <motion.div
      className="fixed left-4 top-24 bottom-4 w-64 glassmorphism p-4"
      initial={{ x: -100 }}
      animate={{ x: 0 }}
      transition={{ type: 'spring', stiffness: 120 }}
    >

      <div className={`flex flex-col gap-6 ${(!user || !isRegistered) && 'blur-sm'}`}>
        {sidebarItems.map((item, index) => (
          <div key={index} className="relative">
            <Link href={item.path}>
              <Button
                variant="ghost"
                className="w-full justify-start text-white hover:bg-primary/20 hover:text-white transition-all duration-300 py-4"
              >
                <item.icon className="mr-3 h-5 w-5" />
                {item.label}
              </Button>
            </Link>
            {index !== sidebarItems.length - 1 && (
              <div className="absolute bottom-0 left-2 right-2 h-[1px] bg-gradient-to-r from-transparent via-pink-200/30 to-transparent" />
            )}
          </div>
        ))}
      </div>
      
      {!user && (
        <div className="mt-4">
          <Button 
            onClick={() => window.location.href = '/api/auth/login'} 
            className="w-full btn-primary"
          >
            Log In to Access
          </Button>
        </div>
      )}

      {user && !isRegistered && (
        <div className="mt-4">
          <Button 
            onClick={() => window.location.href = '/registration'} 
            className="w-full btn-secondary"
          >
            Complete Registration
          </Button>
        </div>
      )}

    </motion.div>
  )
}