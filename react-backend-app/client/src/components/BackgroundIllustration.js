import React from 'react';

export default function BackgroundIllustration() {
    return (
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <svg
          className="absolute bottom-0 left-1/2 transform -translate-x-1/2"
          width="1200"
          height="400"
          viewBox="0 0 1200 400"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M0 400V200L400 300L800 150L1200 250V400H0Z"
            fill="url(#skyline-gradient)"
          />
          <rect x="100" y="250" width="50" height="150" fill="#555" />
          <rect x="300" y="200" width="70" height="200" fill="#666" />
          <rect x="500" y="150" width="60" height="250" fill="#777" />
          <rect x="700" y="100" width="80" height="300" fill="#888" />
          <rect x="900" y="180" width="65" height="220" fill="#999" />
          <rect x="1050" y="220" width="55" height="180" fill="#aaa" />
          <defs>
            <linearGradient id="skyline-gradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#87CEEB" />
              <stop offset="100%" stopColor="#4682B4" />
            </linearGradient>
          </defs>
        </svg>
      </div>
    )
  }

