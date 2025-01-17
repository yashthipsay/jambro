'use client'

import { motion } from 'framer-motion'
import { Button } from './ui/button'

export function LandingContent() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center min-h-screen p-8">
      <motion.h1
        className="text-6xl font-bold text-[#7DF9FF] mb-8 text-center"
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        Gigsaw
      </motion.h1>
      <motion.h2
        className="text-4xl font-bold text-[#E0FFFF] mb-8 text-center"
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        Ready to Rock
      </motion.h2>
      <motion.p
        className="text-xl text-[#C0C0C0] mb-12 text-center max-w-2xl"
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
      >
        Manage your jam rooms with ease and unleash the power of music. Join our community of passionate musicians and room owners today!
      </motion.p>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.6 }}
      >
        <Button size="lg" className="text-lg bg-[#7DF9FF] text-[#191970] hover:bg-[#E0FFFF]">
          Get Started
        </Button>
      </motion.div>
    </div>
  )
}

