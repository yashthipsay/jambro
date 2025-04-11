'use client';

import { motion } from 'framer-motion';
import { Button } from './ui/button';
import { useEffect, useState, useMemo } from 'react';
import { Card } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { useUser } from '@auth0/nextjs-auth0/client';
import { ScrollArea } from '@radix-ui/react-scroll-area';
import { useDashboard } from '../context/DashboardContext';

const INSTRUMENT_TYPES = [
  'Electric Guitar',
  'Ukelele',
  'Bass Guitar',
  'Keyboard',
  'Djembe',
];

const fetchWithAuth = async (url, options = {}) => {
  const token = localStorage.getItem('jamroom_token');
  return fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });
};

const StudioServicesCard = ({ jamRoomId }) => {
  const [services, setServices] = useState([]);
  const [newService, setNewService] = useState({
    serviceName: '',
    description: '',
    category: 'RECORDING',
    subParts: [],
  });
  const [newSubPart, setNewSubPart] = useState({
    name: '',
    description: '',
    price: 0,
  });
  const [editingService, setEditingService] = useState(null);

  const SERVICE_CATEGORIES = [
    'RECORDING',
    'MIXING',
    'MASTERING',
    'PRODUCTION',
    'VIDEO',
  ];

  useEffect(() => {
    fetchServices();
  }, [jamRoomId]);

  const fetchServices = async () => {
    try {
      const response = await fetch(
        `https://api.vision.gigsaw.co.in/api/jamrooms/${jamRoomId}/services`
      );
      const data = await response.json();
      if (data.success) {
        setServices(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching services:', error);
      setServices([]);
    }
  };

  const handleAddSubPart = () => {
    if (!newSubPart.name || !newSubPart.price) return;
    setNewService((prev) => ({
      ...prev,
      subParts: [...prev.subParts, newSubPart],
    }));
    setNewSubPart({ name: '', description: '', price: 0 });
  };

  const handleAddService = async () => {
    try {
      const response = await fetchWithAuth(
        `https://api.vision.gigsaw.co.in/api/jamrooms/${jamRoomId}/services`,
        {
          method: 'POST',
          body: JSON.stringify(newService),
        }
      );

      const data = await response.json();
      if (data.success) {
        setServices(data.data);
        setNewService({
          serviceName: '',
          description: '',
          category: 'RECORDING',
          subParts: [],
        });
      }
    } catch (error) {
      console.error('Error adding service:', error);
    }
  };

  const handleUpdateService = async (serviceId) => {
    try {
      const response = await fetchWithAuth(
        `https://api.vision.gigsaw.co.in/api/jamrooms/${jamRoomId}/services/${serviceId}`,
        {
          method: 'PUT',
          body: JSON.stringify(editingService),
        }
      );

      const data = await response.json();
      if (data.success) {
        setServices((prev) =>
          prev.map((service) =>
            service._id === serviceId ? data.data : service
          )
        );
        setEditingService(null);
      }
    } catch (error) {
      console.error('Error updating service:', error);
    }
  };

  const handleDeleteService = async (serviceId) => {
    try {
      const response = await fetchWithAuth(
        `https://api.vision.gigsaw.co.in/api/jamrooms/${jamRoomId}/services/${serviceId}`,
        { method: 'DELETE' }
      );
      const data = await response.json();
      if (data.success) {
        setServices(data.data);
      }
    } catch (error) {
      console.error('Error deleting service:', error);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card className="glass-card border-[#7DF9FF]/30 bg-gradient-to-b from-white/10 to-purple-500/10">
        <div className="p-4 sm:p-6">
          <h2 className="text-xl sm:text-2xl font-bold text-[#7DF9FF] mb-4">
            Studio Services
          </h2>

          <div className="space-y-4 mb-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <Input
                placeholder="Service Name"
                value={newService.serviceName}
                onChange={(e) =>
                  setNewService({ ...newService, serviceName: e.target.value })
                }
                className="bg-black/20 border-[#7DF9FF]/30 text-white"
              />
              <select
                value={newService.category}
                onChange={(e) =>
                  setNewService({ ...newService, category: e.target.value })
                }
                className="bg-black/20 border border-[#7DF9FF]/30 rounded p-2 text-white"
              >
                {SERVICE_CATEGORIES.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>

            <Input
              placeholder="Service Description"
              value={newService.description}
              onChange={(e) =>
                setNewService({ ...newService, description: e.target.value })
              }
              className="bg-black/20 border-[#7DF9FF]/30 text-white"
            />

            <div className="space-y-2">
              <Label className="text-[#7DF9FF]">Add Sub-parts</Label>
              <div className="flex gap-4">
                <Input
                  placeholder="Sub-part Name"
                  value={newSubPart.name}
                  onChange={(e) =>
                    setNewSubPart({ ...newSubPart, name: e.target.value })
                  }
                  className="bg-black/20 border-[#7DF9FF]/30 text-white"
                />
                <Input
                  type="number"
                  placeholder="Price"
                  value={newSubPart.price}
                  onChange={(e) =>
                    setNewSubPart({
                      ...newSubPart,
                      price: Number(e.target.value),
                    })
                  }
                  className="bg-black/20 border-[#7DF9FF]/30 text-white w-32"
                />
                <Button
                  onClick={handleAddSubPart}
                  className="bg-[#7DF9FF]/20 hover:bg-[#7DF9FF]/30 text-white"
                >
                  Add Sub-part
                </Button>
              </div>
            </div>

            {newService.subParts.length > 0 && (
              <div className="space-y-2">
                <Label className="text-[#7DF9FF]">Added Sub-parts:</Label>
                <div className="grid grid-cols-2 gap-2">
                  {newService.subParts.map((subPart, index) => (
                    <div
                      key={index}
                      className="flex justify-between items-center p-2 bg-black/20 rounded"
                    >
                      <span className="text-white">
                        {subPart.name} - ₹{subPart.price}
                      </span>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() =>
                          setNewService((prev) => ({
                            ...prev,
                            subParts: prev.subParts.filter(
                              (_, i) => i !== index
                            ),
                          }))
                        }
                        className="bg-red-500/20 hover:bg-red-500/30"
                      >
                        Remove
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <Button
              onClick={handleAddService}
              className="bg-[#7DF9FF]/20 hover:bg-[#7DF9FF]/30 text-white w-full"
              disabled={
                !newService.serviceName || newService.subParts.length === 0
              }
            >
              Add Service
            </Button>
          </div>

          <ScrollArea className="max-h-[400px] overflow-y-auto">
            <div className="space-y-4">
              {services.map((service) => (
                <div
                  key={service._id}
                  className="p-4 border border-[#7DF9FF]/30 rounded-lg bg-black/20"
                >
                  {editingService && editingService._id === service._id ? (
                    <div className="space-y-4">
                      <div className="flex flex-col sm:flex-row gap-4">
                        <Input
                          value={editingService.serviceName}
                          onChange={(e) =>
                            setEditingService((prev) => ({
                              ...prev,
                              serviceName: e.target.value,
                            }))
                          }
                          className="bg-black/20 border-[#7DF9FF]/30 text-white"
                        />
                        <select
                          value={editingService.category}
                          onChange={(e) =>
                            setEditingService((prev) => ({
                              ...prev,
                              category: e.target.value,
                            }))
                          }
                          className="bg-black/20 border border-[#7DF9FF]/30 rounded p-2 text-white"
                        >
                          {SERVICE_CATEGORIES.map((category) => (
                            <option key={category} value={category}>
                              {category}
                            </option>
                          ))}
                        </select>
                      </div>

                      <Input
                        value={editingService.description}
                        onChange={(e) =>
                          setEditingService((prev) => ({
                            ...prev,
                            description: e.target.value,
                          }))
                        }
                        className="bg-black/20 border-[#7DF9FF]/30 text-white"
                      />

                      <div className="grid grid-cols-2 gap-2">
                        {editingService.subParts.map((subPart, index) => (
                          <div
                            key={index}
                            className="flex gap-2 items-center p-2 bg-black/30 rounded"
                          >
                            <Input
                              value={subPart.name}
                              onChange={(e) => {
                                const updatedSubParts = [
                                  ...editingService.subParts,
                                ];
                                updatedSubParts[index] = {
                                  ...updatedSubParts[index],
                                  name: e.target.value,
                                };
                                setEditingService((prev) => ({
                                  ...prev,
                                  subParts: updatedSubParts,
                                }));
                              }}
                              className="bg-black/20 border-[#7DF9FF]/30 text-white flex-1"
                            />
                            <Input
                              type="number"
                              value={subPart.price}
                              onChange={(e) => {
                                const updatedSubParts = [
                                  ...editingService.subParts,
                                ];
                                updatedSubParts[index] = {
                                  ...updatedSubParts[index],
                                  price: Number(e.target.value),
                                };
                                setEditingService((prev) => ({
                                  ...prev,
                                  subParts: updatedSubParts,
                                }));
                              }}
                              className="bg-black/20 border-[#7DF9FF]/30 text-white w-24"
                            />
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => {
                                setEditingService((prev) => ({
                                  ...prev,
                                  subParts: prev.subParts.filter(
                                    (_, i) => i !== index
                                  ),
                                }));
                              }}
                              className="bg-red-500/20 hover:bg-red-500/30"
                            >
                              X
                            </Button>
                          </div>
                        ))}
                      </div>

                      <div className="flex gap-2">
                        <Button
                          onClick={() => handleUpdateService(service._id)}
                          className="bg-[#7DF9FF]/20 hover:bg-[#7DF9FF]/30 text-white"
                        >
                          Save Changes
                        </Button>
                        <Button
                          onClick={() => setEditingService(null)}
                          variant="outline"
                          className="bg-black/40 hover:bg-black/50 text-white"
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex justify-between items-center mb-2">
                        <div>
                          <h3 className="text-xl font-bold text-[#7DF9FF]">
                            {service.serviceName}
                          </h3>
                          <p className="text-[#7DF9FF]/70">
                            {service.category}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            onClick={() => setEditingService({ ...service })}
                            className="bg-[#7DF9FF]/20 hover:bg-[#7DF9FF]/30 text-white"
                          >
                            Edit
                          </Button>
                          <Button
                            variant="destructive"
                            onClick={() => handleDeleteService(service._id)}
                            className="bg-red-500/20 hover:bg-red-500/30"
                          >
                            Delete
                          </Button>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2 mt-2">
                        {service.subParts.map((subPart, index) => (
                          <div key={index} className="p-2 bg-black/30 rounded">
                            <div className="text-[#7DF9FF]">{subPart.name}</div>
                            <div className="text-[#7DF9FF]/70">
                              ₹{subPart.price}
                            </div>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>
      </Card>
    </motion.div>
  );
};

const AddonsCard = ({ jamRoomId }) => {
  const [addons, setAddons] = useState([]);
  const { user } = useUser();
  const [newAddon, setNewAddon] = useState({
    instrumentType: '',
    quantity: 1,
    pricePerHour: 0,
    isAvailable: true,
  });

  useEffect(() => {
    fetchAddons();
  }, [jamRoomId]);

  const fetchAddons = async () => {
    try {
      const response = await fetch(
        `https://api.vision.gigsaw.co.in/api/jamrooms/email/${user.email}`
      );
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
      const response = await fetchWithAuth(
        `https://api.vision.gigsaw.co.in/api/jamrooms/${jamRoomId}/addons`,
        {
          method: 'PUT',
          body: JSON.stringify({
            addons: [...addons, newAddon],
          }),
        }
      );

      const data = await response.json();
      if (data.success) {
        setAddons(data.data);
        setNewAddon({
          instrumentType: '',
          quantity: 1,
          pricePerHour: 0,
          isAvailable: true,
        });
      }
    } catch (error) {
      console.error('Error adding addon:', error);
    }
  };

  const handleDeleteAddon = async (addonId) => {
    try {
      const response = await fetch(
        `https://api.vision.gigsaw.co.in/api/jamrooms/${jamRoomId}/addons/${addonId}`,
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
      <Card className="glass-card border-[#7DF9FF]/30 bg-gradient-to-b from-white/10 to-purple-500/10">
        <div className="p-4 sm:p-6">
          <h2 className="text-xl sm:text-2xl font-bold text-[#7DF9FF]">
            Equipment for Rent
          </h2>
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <select
                value={newAddon.instrumentType}
                onChange={(e) =>
                  setNewAddon({ ...newAddon, instrumentType: e.target.value })
                }
                className="bg-black/20 border border-[#7DF9FF]/30 rounded p-2 text-white w-full sm:flex-1"
              >
                <option value="">Select Instrument</option>
                {INSTRUMENT_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>

              <div className="flex gap-4">
                <Input
                  type="number"
                  placeholder="Qty"
                  value={newAddon.quantity}
                  onChange={(e) =>
                    setNewAddon({
                      ...newAddon,
                      quantity: parseInt(e.target.value),
                    })
                  }
                  min="1"
                  className="w-full sm:w-20 bg-black/20 border-[#7DF9FF]/30 text-white"
                />

                <Input
                  type="number"
                  placeholder="₹/hr"
                  value={newAddon.pricePerHour}
                  onChange={(e) =>
                    setNewAddon({
                      ...newAddon,
                      pricePerHour: parseInt(e.target.value),
                    })
                  }
                  min="0"
                  className="w-full sm:w-20 bg-black/20 border-[#7DF9FF]/30 text-white"
                />
              </div>

              <Button
                onClick={handleAddAddon}
                className="w-full sm:w-auto bg-[#7DF9FF]/20 hover:bg-[#7DF9FF]/30 text-white"
              >
                Add
              </Button>
            </div>
            <ScrollArea className="max-h-[120px] overflow-y-auto">
              <div className="space-y-3">
                {addons.map((addon) => (
                  <div
                    key={addon._id}
                    className="flex justify-between items-center p-3 border-b border-[#7DF9FF]/20 hover:bg-black/20 transition-colors"
                  >
                    <div className="text-[#7DF9FF] font-medium">
                      <span className="font-semibold">
                        {addon.instrumentType}
                      </span>
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
  const { jamRoomId } = useDashboard();
  const [payouts, setPayouts] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [stats, setStats] = useState([
    { id: 1, name: 'Booked ahead', count: 0 },
    { id: 2, name: 'Pending Payouts', count: 0 },
    { id: 3, name: 'Completed Sessions', count: 0 },
  ]);

  useEffect(() => {
    async function fetchData() {
      let fundAccountId;
      try {
        const tokenStr = localStorage.getItem('jamroom_token');
        fundAccountId = JSON.parse(atob(tokenStr.split('.')[1])).fundAccountId;

        const payoutsResponse = await fetchWithAuth(
          `https://api.vision.gigsaw.co.in/api/payouts/${jamRoomId}`
        );
        const payoutsData = await payoutsResponse.json();

        const bookingsResponse = await fetchWithAuth(
          `https://api.vision.gigsaw.co.in/api/bookings/jamroom/${jamRoomId}`
        );
        const bookingsData = await bookingsResponse.json();

        if (payoutsData.success && bookingsData.success) {
          setPayouts(payoutsData.data);
          setBookings(bookingsData.data);

          const pendingPayouts = payoutsData.data.filter((payout) =>
            ['PENDING', 'processing', 'queued'].includes(payout.status)
          ).length;

          const bookedAhead = bookingsData.data.filter(
            (booking) => booking.status === 'NOT_STARTED'
          ).length;

          const completedSessions = bookingsData.data.filter(
            (booking) => booking.status === 'COMPLETED'
          ).length;

          setStats([
            { id: 1, name: 'Booked ahead', count: bookedAhead },
            { id: 2, name: 'Pending Payouts', count: pendingPayouts },
            { id: 3, name: 'Completed Sessions', count: completedSessions },
          ]);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    }

    if (jamRoomId) {
      fetchData();
    }
  }, [jamRoomId]);

  const netTotal = useMemo(() => {
    const now = new Date();
    const startOfToday = Math.floor(
      new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime() /
        1000
    );
    const endOfToday = Math.floor(
      new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate(),
        23,
        59,
        59,
        999
      ).getTime() / 1000
    );
    const todaysPayouts = payouts.filter((item) => {
      const created = item.created_at || item.createdAt;
      const createdTimestamp =
        typeof created === 'number'
          ? created
          : Math.floor(new Date(created).getTime() / 1000);
      return createdTimestamp >= startOfToday && createdTimestamp <= endOfToday;
    });
    const total = todaysPayouts.reduce((sum, item) => {
      if (['processed', 'COMPLETED'].includes(item.status)) {
        return sum + (item.amount - (item.fees || 0) - (item.tax || 0));
      }
      return sum;
    }, 0);

    return total;
  }, [payouts]);

  return (
    <div className="flex-1 p-4 sm:p-8 pl-4 sm:pl-72 pt-20 sm:pt-24 h-screen overflow-y-auto">
      <div className="max-w-7xl mx-auto space-y-4 pb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Card className="glass-card border-[#7DF9FF]/30 bg-black/10">
              <div className="p-4 sm:p-6">
                <h2 className="text-xl sm:text-2xl font-bold mb-4 text-[#7DF9FF]">
                  Today's Earnings
                </h2>
                <div className="text-2xl sm:text-4xl font-bold text-[#7DF9FF]">
                  ₹{netTotal.toLocaleString()}
                </div>
              </div>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Card className="glass-card border-[#7DF9FF]/30 bg-black/10">
              <div className="p-4 sm:p-6">
                <h2 className="text-xl sm:text-2xl font-bold mb-4 text-[#7DF9FF]">
                  Quick Stats
                </h2>
                <div className="grid grid-cols-3 gap-2 sm:gap-4">
                  {stats.map((stat) => (
                    <div key={stat.id} className="text-center">
                      <div className="text-xl sm:text-3xl font-bold text-[#7DF9FF]">
                        {stat.count}
                      </div>
                      <div className="text-xs sm:text-sm text-[#7DF9FF]/80">
                        {stat.name}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          </motion.div>
        </div>

        {jamRoomId && (
          <div className="w-full">
            <AddonsCard jamRoomId={jamRoomId} />
          </div>
        )}

        {jamRoomId && (
          <div className="w-full">
            <StudioServicesCard jamRoomId={jamRoomId} />
          </div>
        )}

        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <Card className="glass-card border-[#7DF9FF]/30 bg-black/10">
            <div className="p-4 sm:p-6">
              <h2 className="text-xl sm:text-2xl font-bold mb-4 text-[#7DF9FF]">
                Recent Activity
              </h2>
              <div className="text-sm sm:text-base text-[#7DF9FF]/80">
                Coming soon...
              </div>
            </div>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
