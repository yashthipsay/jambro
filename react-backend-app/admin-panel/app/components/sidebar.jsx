'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Button } from './ui/button'
import { Home, Calendar, Music, Settings } from 'lucide-react'
import { useUser } from '@auth0/nextjs-auth0/client'

export function Sidebar() {
  const { user, error, isLoading } = useUser()
  const [isRegistered, setIsRegistered] = useState(false)
  const [isJamRoomRegistered, setIsJamRoomRegistered] = useState(false);

  useEffect(() => {
    const checkJamRoomRegistration = async () => {
      if (user) {
        console.log(user.email);
        try {
          const response = await fetch('http://localhost:5000/api/jamrooms/is-registered-by-email', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ ownerEmail: user.email }),
          });

          const data = await response.json();
          setIsJamRoomRegistered(data.success);

          // If jam room is not registered, redirect to registration page
          if (!data.success) {
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
    { icon: Home, label: 'Dashboard' },
    { icon: Calendar, label: 'Bookings' },
    { icon: Music, label: 'Jam Sessions' },
    { icon: Settings, label: 'Settings' },
  ]

  return (
    <motion.div
      className="fixed left-4 top-24 bottom-4 w-64 bg-[#191970] bg-opacity-80 backdrop-blur-md rounded-lg shadow-lg p-4 border border-[#7DF9FF]"
      initial={{ x: -100 }}
      animate={{ x: 0 }}
      transition={{ type: 'spring', stiffness: 120 }}
    >
      <div className={`space-y-4 ${(!user || !isRegistered) && 'blur-sm'}`}>
        {sidebarItems.map((item, index) => (
          <Button
            key={index}
            variant="ghost"
            className="w-full justify-start text-[#E0FFFF] hover:bg-[#7DF9FF] hover:text-[#191970]"
          >
            <item.icon className="mr-2 h-4 w-4" />
            {item.label}
          </Button>
        ))}
      </div>
      {!user && (
        <div className="mt-4">
          <Button onClick={() => window.location.href = '/api/auth/login'} className="w-full bg-[#7DF9FF] text-[#191970] hover:bg-[#E0FFFF]">
            Log In to Access
          </Button>
        </div>
      )}
      {user && !isRegistered && (
        <div className="mt-4">
          <Button onClick={() => window.location.href = '/registration'} className="w-full bg-[#C0C0C0] text-[#191970] hover:bg-[#E0FFFF]">
            Complete Registration
          </Button>
        </div>
      )}
    </motion.div>
  )
}