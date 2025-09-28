import React, { useState } from 'react';
import InstrumentCard from '../components/InstrumentCard';

const InstrumentsSection = ({ 
  instruments, 
  cartItems, 
  onBookInstrument 
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('All');
  const [sortBy, setSortBy] = useState('name');
  const [showFilters, setShowFilters] = useState(false);

  const instrumentTypes = ['All', 'Electric Guitar', 'Accessory', 'Electronic Drums', 'Digital Piano', 'Acoustic Guitar', 'Bass Guitar'];

  const filteredInstruments = instruments
    .filter(instrument => {
      const matchesSearch = instrument.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          instrument.type.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesType = filterType === 'All' || instrument.type === filterType;
      return matchesSearch && matchesType;
    })
    .sort((a, b) => {
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      if (sortBy === 'price') return a.pricePerDay - b.pricePerDay;
      if (sortBy === 'type') return a.type.localeCompare(b.type);
      return 0;
    });

  return (
    <>
      {/* Header Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/20 to-purple-600/20"></div>
        <div className="relative px-4 py-8 sm:py-12 md:py-16">
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600 mb-3 sm:mb-4 leading-tight">
              Instrument Rentals
            </h1>
            <p className="text-base sm:text-lg md:text-xl text-gray-700 px-2 sm:px-4">
              Rent high-quality instruments for your music sessions. From guitars to drums, we have everything you need.
            </p>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="px-4 py-4 sm:py-6 md:py-8 pb-32 md:pb-8">
        <div className="max-w-7xl mx-auto">
          {/* Search Bar */}
          <div className="mb-4">
            <div className="relative">
              <input
                type="text"
                placeholder="Search instruments..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-3 sm:py-3.5 bg-white/80 border border-indigo-200 rounded-xl text-gray-800 placeholder-gray-500 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-200 text-sm sm:text-base shadow-sm"
              />
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>
          </div>

          {/* Filter Toggle */}
          <div className="mb-4 sm:mb-6">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-3 bg-white/80 backdrop-blur-sm border border-indigo-200 rounded-xl text-gray-700 text-sm font-medium hover:bg-indigo-50 transition-colors shadow-sm"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.207A1 1 0 013 6.5V4z" />
              </svg>
              Filters & Sort
              <svg className={`w-4 h-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </div>

          {/* Filter Panel */}
          {showFilters && (
            <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-indigo-200 p-4 mb-6 space-y-4 shadow-sm">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <label className="block text-sm font-medium text-indigo-700">Filter by Type</label>
                  <select
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                    className="w-full px-3 py-2.5 bg-white border border-indigo-200 rounded-lg text-gray-800 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-200 text-sm"
                  >
                    {instrumentTypes.map(type => (
                      <option key={type} value={type} className="bg-white">
                        {type}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-3">
                  <label className="block text-sm font-medium text-indigo-700">Sort By</label>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="w-full px-3 py-2.5 bg-white border border-indigo-200 rounded-lg text-gray-800 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-200 text-sm"
                  >
                    <option value="name" className="bg-white">Name</option>
                    <option value="price" className="bg-white">Price</option>
                    <option value="type" className="bg-white">Type</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Results Count */}
          <div className="mb-4 px-2">
            <p className="text-gray-600 text-sm">
              {filteredInstruments.length} of {instruments.length} instruments
            </p>
          </div>

          {/* Instruments Grid */}
          {filteredInstruments.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {filteredInstruments.map((instrument) => (
                <InstrumentCard
                  key={instrument.id}
                  id={instrument.id}
                  imageUrl={instrument.imageUrl}
                  name={instrument.name}
                  type={instrument.type}
                  pricePerDay={instrument.pricePerDay}
                  availabilityStatus={instrument.availabilityStatus}
                  onBook={() => onBookInstrument(instrument.id)}
                  isInCart={cartItems.some(item => item.id === instrument.id)}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 sm:py-16 px-4">
              <div className="text-4xl sm:text-6xl mb-3 sm:mb-4">🎵</div>
              <h3 className="text-xl sm:text-2xl font-bold text-indigo-600 mb-2">No instruments found</h3>
              <p className="text-gray-600 text-sm sm:text-base">Try adjusting your search or filter criteria</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default InstrumentsSection;