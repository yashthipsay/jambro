'use client'

import { useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Button } from './ui/button'
import { useUser } from '@auth0/nextjs-auth0/client'

export function Navbar() {
  const { user, error, isLoading } = useUser()

  return (
    <motion.nav
      className="fixed top-4 left-4 right-4 z-50 flex justify-between items-center p-4 bg-[#191970] bg-opacity-80 backdrop-blur-md rounded-lg shadow-lg border border-[#7DF9FF]"
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ type: 'spring', stiffness: 120 }}
    >
      <Link href="/">
        <motion.h1
          className="text-2xl font-bold text-[#7DF9FF]"
          whileHover={{ scale: 1.05 }}
        >
          Gigsaw Admin
        </motion.h1>
      </Link>
      <div>
        {isLoading ? (
          <Button variant="outline" className="border-[#7DF9FF] text-[#7DF9FF]">
            Loading...
          </Button>
        ) : user ? (
          <Button
            variant="outline"
            className="border-[#7DF9FF] text-[#7DF9FF] hover:bg-[#7DF9FF] hover:text-[#191970]"
            onClick={() => window.location.href = '/api/auth/logout'}
          >
            Log Out
          </Button>
        ) : (
          <Button
            variant="outline"
            className="border-[#7DF9FF] text-[#7DF9FF] hover:bg-[#7DF9FF] hover:text-[#191970]"
            onClick={() => window.location.href = '/api/auth/login'}
          >
            Log In
          </Button>
        )}
      </div>
    </motion.nav>
  )
}