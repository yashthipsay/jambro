'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Button } from './ui/button'
import { useUser } from '@auth0/nextjs-auth0/client'
import { useRouter } from 'next/navigation'

export function Navbar() {
  const { user, error, isLoading } = useUser()
  const router = useRouter()

  const [jamRoomName, setJamRoomName] = useState('')

  useEffect(() => {
    const fetchJamRoomName = async () => {
      if (user?.email) {
        try {
          const response = await fetch(`http://13.126.198.106:5000/api/jamrooms/email/${user.email}`)
          const data = await response.json()
          if (data.success && data.data) {
            setJamRoomName(data.data.jamRoomDetails.name)
          }
          console.log(data)
        } catch (error) {
          console.error('Error fetching jam room name:', error)
        }
      }
    }

    fetchJamRoomName()
  }, [user])

  return (
    <motion.nav
      className="fixed top-4 left-4 right-4 z-50 flex justify-between items-center p-4 glassmorphism rounded-lg shadow-lg"

      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ type: 'spring', stiffness: 120 }}
    >
      <Link href="/">
      <motion.h1
        className="text-3xl gradient-text"
        whileHover={{ scale: 1.05 }}
        >
          Gigsaw Admin - {`${jamRoomName}`}
        </motion.h1>
      </Link>
      <div>
        {isLoading ? (
          <Button variant="outline" className="btn-secondary">
            Loading...
          </Button>
        ) : user ? (
          <Button
            variant="outline"
            className="btn-secondary"
            onClick={() => window.location.href = '/api/auth/logout'}
          >
            Log Out
          </Button>
        ) : (
          <Button
            variant="outline"
            className="btn-secondary"
            onClick={() => window.location.href = '/api/auth/login'}
          >
            Log In
          </Button>
        )}
      </div>
    </motion.nav>
  )
}