'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Plus, Package, Trash2 } from 'lucide-react';
import { ScrollArea } from './ui/scroll-area';
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from './ui/select';

export function PlansAndPackages() {
  const [plans, setPlans] = useState([]);
  const [packages, setPackages] = useState([]);
  const [newPlan, setNewPlan] = useState({
    name: '',
    description: '',
    price: 0,
    duration: 1,
    durationType: 'month',
    features: [],
    skuId: '',
  });
  const [newPackage, setNewPackage] = useState({
    name: '',
    description: '',
    plans: [],
    discount: 0,
    skuId: '',
  });
  const [newFeature, setNewFeature] = useState('');

  const handleAddPlan = () => {
    if (!newPlan.name || !newPlan.price) return;
    setPlans([...plans, { ...newPlan, id: Date.now() }]);
    setNewPlan({
      name: '',
      description: '',
      price: 0,
      duration: 1,
      durationType: 'month',
      features: [],
      skuId: '',
    });
  };

  const handleAddFeature = () => {
    if (!newFeature) return;
    setNewPlan({
      ...newPlan,
      features: [...newPlan.features, newFeature],
    });
    setNewFeature('');
  };

  const handleRemoveFeature = (index) => {
    setNewPlan({
      ...newPlan,
      features: newPlan.features.filter((_, i) => i !== index),
    });
  };

  const handleAddPackage = () => {
    if (!newPackage.name || newPackage.plans.length === 0) return;
    setPackages([...packages, { ...newPackage, id: Date.now() }]);
    setNewPackage({
      name: '',
      description: '',
      plans: [],
      discount: 0,
      skuId: '',
    });
  };

  return (
    <div className="flex-1 p-8 pl-72 pt-24 h-screen overflow-y-auto">
      <div className="max-w-7xl mx-auto space-y-6 pb-8">
        {/* Individual Plans Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Card className="glass-card border-[#7DF9FF]/30 bg-black/10">
            <CardContent className="p-6">
              <h2 className="text-2xl font-bold mb-4 text-[#7DF9FF]">
                Create Individual Plan
              </h2>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <Label className="text-[#7DF9FF]/80">Plan Name</Label>
                  <Input
                    value={newPlan.name}
                    onChange={(e) =>
                      setNewPlan({ ...newPlan, name: e.target.value })
                    }
                    className="bg-black/20 border-[#7DF9FF]/30 text-white"
                    placeholder="e.g., Basic Plan"
                  />
                </div>
                <div>
                  <Label className="text-[#7DF9FF]/80">Price (₹)</Label>
                  <Input
                    type="number"
                    value={newPlan.price}
                    onChange={(e) =>
                      setNewPlan({
                        ...newPlan,
                        price: parseFloat(e.target.value),
                      })
                    }
                    className="bg-black/20 border-[#7DF9FF]/30 text-white"
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <Label className="text-[#7DF9FF]/80">Duration</Label>
                  <Input
                    type="number"
                    value={newPlan.duration}
                    onChange={(e) =>
                      setNewPlan({
                        ...newPlan,
                        duration: parseInt(e.target.value),
                      })
                    }
                    className="bg-black/20 border-[#7DF9FF]/30 text-white"
                    min="1"
                  />
                </div>
                <div>
                  <Label className="text-[#7DF9FF]/80">Duration Type</Label>
                  <Select
                    value={newPlan.durationType}
                    onValueChange={(value) =>
                      setNewPlan({ ...newPlan, durationType: value })
                    }
                  >
                    <SelectTrigger className="bg-black/20 border-[#7DF9FF]/30 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-black/80 border-[#7DF9FF]/30">
                      <SelectItem value="day">Days</SelectItem>
                      <SelectItem value="month">Months</SelectItem>
                      <SelectItem value="year">Years</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="mb-4">
                <Label className="text-[#7DF9FF]/80">Description</Label>
                <Input
                  value={newPlan.description}
                  onChange={(e) =>
                    setNewPlan({ ...newPlan, description: e.target.value })
                  }
                  className="bg-black/20 border-[#7DF9FF]/30 text-white"
                  placeholder="Plan description"
                />
              </div>

              <div className="mb-4">
                <Label className="text-[#7DF9FF]/80">Features</Label>
                <div className="flex gap-2 mb-2">
                  <Input
                    value={newFeature}
                    onChange={(e) => setNewFeature(e.target.value)}
                    className="bg-black/20 border-[#7DF9FF]/30 text-white"
                    placeholder="Add a feature"
                  />
                  <Button
                    onClick={handleAddFeature}
                    className="bg-[#7DF9FF]/20 hover:bg-[#7DF9FF]/30 text-white"
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
                <ScrollArea className="h-24">
                  {newPlan.features.map((feature, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-2 bg-black/20 rounded mb-1"
                    >
                      <span className="text-white">{feature}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveFeature(index)}
                        className="hover:bg-red-500/20"
                      >
                        <Trash2 className="w-4 h-4 text-red-400" />
                      </Button>
                    </div>
                  ))}
                </ScrollArea>
              </div>

              <Button
                onClick={handleAddPlan}
                className="w-full bg-gradient-to-r from-[#7DF9FF]/20 to-[#00BFFF]/20 hover:from-[#7DF9FF]/30 hover:to-[#00BFFF]/30 text-white"
              >
                Create Plan
              </Button>
            </CardContent>
          </Card>
        </motion.div>

        {/* Packages Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Card className="glass-card border-[#7DF9FF]/30 bg-black/10">
            <CardContent className="p-6">
              <h2 className="text-2xl font-bold mb-4 text-[#7DF9FF] flex items-center gap-2">
                <Package className="w-6 h-6" />
                Create Package
              </h2>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <Label className="text-[#7DF9FF]/80">Package Name</Label>
                  <Input
                    value={newPackage.name}
                    onChange={(e) =>
                      setNewPackage({ ...newPackage, name: e.target.value })
                    }
                    className="bg-black/20 border-[#7DF9FF]/30 text-white"
                    placeholder="e.g., Premium Bundle"
                  />
                </div>
                <div>
                  <Label className="text-[#7DF9FF]/80">Discount (%)</Label>
                  <Input
                    type="number"
                    value={newPackage.discount}
                    onChange={(e) =>
                      setNewPackage({
                        ...newPackage,
                        discount: parseFloat(e.target.value),
                      })
                    }
                    className="bg-black/20 border-[#7DF9FF]/30 text-white"
                    placeholder="0"
                    min="0"
                    max="100"
                  />
                </div>
              </div>

              <div className="mb-4">
                <Label className="text-[#7DF9FF]/80">Description</Label>
                <Input
                  value={newPackage.description}
                  onChange={(e) =>
                    setNewPackage({
                      ...newPackage,
                      description: e.target.value,
                    })
                  }
                  className="bg-black/20 border-[#7DF9FF]/30 text-white"
                  placeholder="Package description"
                />
              </div>

              <div className="mb-4">
                <Label className="text-[#7DF9FF]/80">Select Plans</Label>
                <ScrollArea className="h-48 border border-[#7DF9FF]/30 rounded-md p-2">
                  {plans.map((plan) => (
                    <div
                      key={plan.id}
                      className="flex items-center justify-between p-2 bg-black/20 rounded mb-1"
                    >
                      <div>
                        <h3 className="text-[#7DF9FF]">{plan.name}</h3>
                        <p className="text-white/60 text-sm">₹{plan.price}</p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const isSelected = newPackage.plans.includes(plan.id);
                          setNewPackage({
                            ...newPackage,
                            plans: isSelected
                              ? newPackage.plans.filter((id) => id !== plan.id)
                              : [...newPackage.plans, plan.id],
                          });
                        }}
                        className={`${
                          newPackage.plans.includes(plan.id)
                            ? 'bg-[#7DF9FF]/20 text-white'
                            : 'bg-transparent text-[#7DF9FF]'
                        }`}
                      >
                        {newPackage.plans.includes(plan.id)
                          ? 'Selected'
                          : 'Select'}
                      </Button>
                    </div>
                  ))}
                </ScrollArea>
              </div>

              <Button
                onClick={handleAddPackage}
                className="w-full bg-gradient-to-r from-[#7DF9FF]/20 to-[#00BFFF]/20 hover:from-[#7DF9FF]/30 hover:to-[#00BFFF]/30 text-white"
                disabled={newPackage.plans.length === 0}
              >
                Create Package
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}

export default PlansAndPackages;
