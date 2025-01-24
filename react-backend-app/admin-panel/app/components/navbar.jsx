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



  return (
    <motion.nav
      className="fixed top-4 left-4 right-4 z-50 flex justify-between items-center p-4 nav-gradient rounded-lg shadow-lg"
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ type: 'spring', stiffness: 120 }}
    >
      <Link href="/">
        <motion.h1
          className="text-3xl font-bold gradient-text"
          whileHover={{ scale: 1.05 }}
        >
          Gigsaw Admin
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