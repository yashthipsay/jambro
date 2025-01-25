'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Button } from './ui/button'
import { Home, Receipt, Wallet, Settings, UserCircle } from 'lucide-react'
import { useUser } from '@auth0/nextjs-auth0/client'
import Link from 'next/link'


export function Sidebar() {
  const { user, error, isLoading } = useUser()
  const [isRegistered, setIsRegistered] = useState(false)
  const [jamRoomId, setJamRoomId] = useState(null)
  const [fundAccountId, setFundAccountId] = useState(null)

  useEffect(() => {
    const checkJamRoomRegistration = async () => {
      if (user) {
        console.log('Checking registration for:', user.email)
        try {
          const response = await fetch('http://localhost:5000/api/jamrooms/is-registered', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ ownerEmail: user.email }),
          });
  
          const data = await response.json();
          console.log('Registration check response:', data);
          setIsRegistered(data.success);
          console.log('Is Registered:', data.success);
  
          // If jam room is not registered, redirect to registration page
          if (data.success) {
            setJamRoomId(data.data._id);
            setFundAccountId(data.data.bankValidationData.fund_account.id);
            console.log('Jam Room ID:', data.data._id);
            console.log('Fund Account ID:', data.data.bankValidationData.fund_account.id);
          } else {
            window.location.href = '/registration';
          }
        } catch (err) {
          console.error('Error checking jam room registration:', err);
        }
      }
    };
  
    checkJamRoomRegistration();
  }, [user]);

  const sidebarItems = [
    { icon: Home, label: 'Dashboard', path: '/' },
    { icon: Receipt, label: 'Booking History', path: `/bookings/${jamRoomId}` },
    { icon: Wallet, label: 'Payout History', path: `/payouts/${fundAccountId}` },
    { icon: UserCircle, label: 'Profile', path: `/profile/${jamRoomId}` },
    { icon: Settings, label: 'Settings', path: '/settings' },

  ];

  return (
    <motion.div
      className="fixed left-4 top-24 bottom-4 w-64 sidebar-gradient rounded-lg shadow-lg p-4"
      initial={{ x: -100 }}
      animate={{ x: 0 }}
      transition={{ type: 'spring', stiffness: 120 }}
    >
     <div className={`flex flex-col gap-6 ${(!user || !isRegistered) && 'blur-sm'}`}>
        {sidebarItems.map((item, index) => (
                  <div key={index} className="relative">
          <Link href={item.path} key={index}>
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
          <Button onClick={() => window.location.href = '/api/auth/login'} className="w-full btn-primary">
            Log In to Access
          </Button>
        </div>
      )}
      {user && !isRegistered && (
        <div className="mt-4">
          <Button onClick={() => window.location.href = '/registration'} className="w-full btn-secondary">
            Complete Registration
          </Button>
        </div>
      )}
    </motion.div>
  )
}