'use client';
import React, { useState, useEffect } from 'react';
import { Input } from "@/app/components/ui/input";
import { Card } from "@/app/components/ui/card";

const Autocomplete = ({ apiKey, onSelect, initialValue = '' }) => {
  const [inputValue, setInputValue] = useState(initialValue);
  const [suggestions, setSuggestions] = useState([]);
  const [location, setLocation] = useState({ lat: null, lon: null });

  useEffect(() => {
    const getCurrentLocation = () => {
      return new Promise((resolve, reject) => {
        if (!navigator.geolocation) {
          reject(new Error('Geolocation is not supported'));
          return;
        }

        navigator.geolocation.getCurrentPosition(
          (position) => {
            resolve({
              lat: position.coords.latitude,
              lon: position.coords.longitude,
            });
          },
          (error) => {
            reject(error);
          }
        );
      });
    };

    getCurrentLocation()
      .then((loc) => setLocation(loc))
      .catch((error) => console.error('Error getting location:', error));
  }, []);

  useEffect(() => {
    if (initialValue) {
      setInputValue(initialValue);
    }
  }, [initialValue]);

  const handleInputChange = (e) => {
    setInputValue(e.target.value);
    if (e.target.value.length > 2) {
      fetchSuggestions(e.target.value);
    } else {
      setSuggestions([]);
    }
  };

  const handleSuggestionClick = (item) => {
    setInputValue(item.description);
    setSuggestions([]); // Clear suggestions
    if (onSelect) {
      onSelect(item);
    }
  };

  const fetchSuggestions = async (input) => {
    if (!location.lat || !location.lon) return;

    try {
      const response = await fetch(
        `https://api.olamaps.io/places/v1/autocomplete?location=${location.lat},${location.lon}&input=${input}&api_key=${apiKey}`,
        {
          headers: {
            'X-Request-Id': 'a623e8cd-bcd5-4d9a-beb3-ea7df3f5092e',
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch suggestions');
      }

      const data = await response.json();
      if (data.predictions) {
        setSuggestions(data.predictions);
      }
    } catch (error) {
      console.error('Error fetching suggestions:', error);
      setSuggestions([]);
    }
  };

  return (
    <div className="relative w-full">
      <Input
        placeholder="Enter a location"
        value={inputValue}
        onChange={handleInputChange}
        className="mb-3"
      />
      {suggestions.length > 0 && (
        <Card className="absolute top-full left-0 right-0 z-50 max-h-[300px] overflow-y-auto">
          <ul className="py-2">
            {suggestions.map((item, index) => (
              <li
                key={index}
                onClick={() => handleSuggestionClick(item)}
                className="px-3 py-2 hover:bg-accent cursor-pointer transition-colors"
              >
                {item.description}
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
};

export default Autocomplete;