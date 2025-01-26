'use client'

import { motion } from 'framer-motion'
import { Button } from './ui/button'
import { useEffect, useState } from 'react'
import { Card } from './ui/card'

export function LandingContent() {
  const [netTotal, setNetTotal] = useState(0)
  const [addons, setAddons] = useState([
    { id: 1, name: 'Active Bookings', count: 0 },
    { id: 2, name: 'Pending Payouts', count: 0 },
    { id: 3, name: 'Completed Sessions', count: 0 }
  ])
  return (
    <div className="flex-1 p-8 pl-72 pt-24"> {/* Adjusted padding for sidebar and navbar */}
      <div className="max-w-7xl mx-auto space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Card 1: Today's Earnings */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Card className="glass-card border-[#7DF9FF]/30 bg-black/10">
              <div className="p-6">
                <h2 className="text-2xl font-bold mb-4 text-[#7DF9FF]">Today's Earnings</h2>
                <div className="text-4xl font-bold text-[#7DF9FF]">
                  ₹{netTotal.toLocaleString()}
                </div>
              </div>
            </Card>
          </motion.div>
          {/* Card 2: Quick Stats */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Card className="glass-card border-[#7DF9FF]/30 bg-black/10">
              <div className="p-6">
                <h2 className="text-2xl font-bold mb-4 text-[#7DF9FF]">Quick Stats</h2>
                <div className="grid grid-cols-3 gap-4">
                  {addons.map(addon => (
                    <div key={addon.id} className="text-center">
                      <div className="text-3xl font-bold text-[#7DF9FF]">{addon.count}</div>
                      <div className="text-sm text-[#7DF9FF]/80">{addon.name}</div>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          </motion.div>
          </div>
        {/* Section 3: Welcome Message and CTA */}
        <motion.div
          className="text-center space-y-6"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <motion.h1
            className="text-4xl md:text-6xl font-audiowide gradient-text"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.6 }}
          >
            Welcome to Gigsaw
          </motion.h1>
          <motion.p
            className="text-lg text-[#7DF9FF]/80 max-w-2xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.8 }}
          >
            Manage your jamroom bookings and track your earnings all in one place
          </motion.p>
          <Button 
            size="lg" 
            className="btn-primary text-lg px-8 py-4"
          >
            View Bookings
          </Button>
        </motion.div>

      </div>
    </div>
  )
}

