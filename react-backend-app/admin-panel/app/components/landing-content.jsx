'use client'

import { motion } from 'framer-motion'
import { Button } from './ui/button'
import { useEffect, useState } from 'react'
import { Card } from './ui/card'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { useUser } from '@auth0/nextjs-auth0/client'
import { ScrollArea } from '@radix-ui/react-scroll-area'

const INSTRUMENT_TYPES = [
  'Electric Guitar',
  'Ukelele',
  'Bass Guitar',
  'Keyboard',
  'Djembe'
];

const AddonsCard = ({ jamRoomId }) => {
  const [addons, setAddons] = useState([]);
  const { user } = useUser();
  const [newAddon, setNewAddon] = useState({
    instrumentType: '',
    quantity: 1,
    pricePerHour: 0,
    isAvailable: true
  });

  useEffect(() => {
    fetchAddons();
  }, [jamRoomId]);

  const fetchAddons = async () => {
    try {
      const response = await fetch(`http://13.126.198.106:5000/api/jamrooms/email/${user.email}`);
      const data = await response.json();
      if (data.success && data.data) {
        setAddons(data.data.addons || []);
      }
    } catch (error) {
      console.error('Error fetching addons:', error);
      setAddons([]);
    }
  };

  const handleAddAddon = async () => {
    try {
      const response = await fetch(
        `http://13.126.198.106:5000/api/jamrooms/${jamRoomId}/addons`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            addons: [...addons, newAddon]
          })
        }
      );
      const data = await response.json();
      if (data.success) {
        setAddons(data.data);
        setNewAddon({ instrumentType: '', quantity: 1, pricePerHour: 0, isAvailable: true });
      }
    } catch (error) {
      console.error('Error adding addon:', error);
    }
  };

  const handleDeleteAddon = async (addonId) => {
    try {
      const response = await fetch(
        `http://13.126.198.106:5000/api/jamrooms/${jamRoomId}/addons/${addonId}`,
        { method: 'DELETE' }
      );
      const data = await response.json();
      if (data.success) {
        setAddons(data.data);
      }
    } catch (error) {
      console.error('Error deleting addon:', error);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card className="glass-card border-[#7DF9FF]/30 bg-black/10">
        <div className="p-6">
          <h2 className="text-2xl font-bold mb-4 text-[#7DF9FF]">Equipment for Rent</h2>
          <div className="space-y-4">
            <div className="flex gap-4">
              <select
                value={newAddon.instrumentType}
                onChange={(e) => setNewAddon({ ...newAddon, instrumentType: e.target.value })}
                className="bg-black/20 border border-[#7DF9FF]/30 rounded p-2 text-white flex-1"
              >
                <option value="">Select Instrument</option>
                {INSTRUMENT_TYPES.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>

              <Input
                type="number"
                placeholder="Qty"
                value={newAddon.quantity}
                onChange={(e) => setNewAddon({ ...newAddon, quantity: parseInt(e.target.value) })}
                min="1"
                className="w-20 bg-black/20 border-[#7DF9FF]/30 text-white"
              />

              <Input
                type="number"
                placeholder="₹/hr"
                value={newAddon.pricePerHour}
                onChange={(e) => setNewAddon({ ...newAddon, pricePerHour: parseInt(e.target.value) })}
                min="0"
                className="w-24 bg-black/20 border-[#7DF9FF]/30 text-white"
              />

              <Button
                onClick={handleAddAddon}
                className="bg-[#7DF9FF]/20 hover:bg-[#7DF9FF]/30 text-white"
              >
                Add
              </Button>
            </div>
            <ScrollArea className="max-h-[120px] overflow-y-auto">
  <div className="pr-4 space-y-2">
    {addons.map((addon) => (
      <div
        key={addon._id}
        className="flex justify-between items-center p-2 border-b border-[#7DF9FF]/20 hover:bg-black/20 transition-colors"
      >
        <div className="text-[#7DF9FF]">
          <span className="font-semibold">{addon.instrumentType}</span>
          <span className="mx-2">|</span>
          <span>Qty: {addon.quantity}</span>
          <span className="mx-2">|</span>
          <span>₹{addon.pricePerHour}/hr</span>
        </div>
        <Button
          variant="destructive"
          size="sm"
          onClick={() => handleDeleteAddon(addon._id)}
          className="bg-red-500/20 hover:bg-red-500/30"
        >
          Remove
        </Button>
      </div>
    ))}
  </div>
</ScrollArea>
          </div>
        </div>
      </Card>
    </motion.div>
  );
};

export function LandingContent() {
  const { user } = useUser();
  const [netTotal, setNetTotal] = useState(0);
  const [jamRoomId, setJamRoomId] = useState(null);
  const [addons, setAddons] = useState([
    { id: 1, name: 'Active Bookings', count: 0 },
    { id: 2, name: 'Pending Payouts', count: 0 },
    { id: 3, name: 'Completed Sessions', count: 0 }
  ]);

  useEffect(() => {
    const fetchJamRoomData = async () => {
      if (!user?.email) return;
      try {
        const response = await fetch(`http://13.126.198.106:5000/api/jamrooms/email/${user.email}`);
        const data = await response.json();
        if (data.success) {
          setJamRoomId(data.data._id);
        }
      } catch (error) {
        console.error('Error fetching jam room:', error);
      }
    };
    fetchJamRoomData();
  }, [user]);

  return (
    <div className="flex-1 p-8 pl-72 pt-24">
      <div className="max-w-7xl mx-auto space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

        {/* Addons Card */}
        {jamRoomId && <AddonsCard jamRoomId={jamRoomId} />}

        {/* Card 4: Placeholder for future content */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <Card className="glass-card border-[#7DF9FF]/30 bg-black/10">
            <div className="p-6">
              <h2 className="text-2xl font-bold mb-4 text-[#7DF9FF]">Recent Activity</h2>
              <div className="text-[#7DF9FF]/80">
                Coming soon...
              </div>
            </div>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}