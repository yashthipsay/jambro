import React, { useState, useMemo } from 'react';
import { ScrollArea } from "./ui/scroll-area";
import { Button } from "./ui/button";
import { X } from "lucide-react";

export function TimeSlotSelector({ selectedSlots, setSlots }) {
  // Generate 24 hour slots
  const timeSlots = Array.from({ length: 24 }, (_, i) => {
    const hour = i.toString().padStart(2, '0');
    return `${hour}:00`;
  });

    // Create a Set of selected times for O(1) lookup
    const selectedTimes = useMemo(() => 
        new Set(selectedSlots.map(slot => slot.startTime)),
        [selectedSlots]
      );
      console.log(selectedTimes);

  const handleSlotClick = (startTime) => {
    if (selectedTimes.has(startTime)) return;
    // Convert time string to 24h format
    const endHour = (parseInt(startTime) + 1) % 24;
    const endTime = `${endHour.toString().padStart(2, '0')}:00`;
    
    const newSlot = {
      slotId: selectedSlots.length + 1,
      startTime,
      endTime,
      isBooked: false,
      bookedBy: null
    };
    
    setSlots([...selectedSlots, newSlot]);
  };

  const handleDeleteSlot = (slotId) => {
    setSlots(selectedSlots.filter(slot => slot.slotId !== slotId));
  };

  return (
    <div className="space-y-4">
      <ScrollArea className="h-[200px] border rounded-md p-2">
        <div className="grid grid-cols-4 gap-2">
          {timeSlots.map((time) => (
            <Button
              key={time}
              variant="outline"
              className="text-sm"
              disabled={selectedTimes.has(time)}
              onClick={() => handleSlotClick(time)}
            >
              {time}
            </Button>
          ))}
        </div>
      </ScrollArea>

      <div className="space-y-2">
        <h3 className="font-medium">Selected Slots</h3>
        {selectedSlots.map((slot) => (
          <div
            key={slot.slotId}
            className="flex items-center justify-between p-2 border rounded-md"
          >
            <span>
              {slot.startTime} - {slot.endTime}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleDeleteSlot(slot.slotId)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}