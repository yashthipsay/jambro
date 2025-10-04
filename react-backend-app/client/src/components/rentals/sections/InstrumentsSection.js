import React, { useState } from 'react';
import InstrumentCard from '../components/InstrumentCard';

const InstrumentsSection = ({ 
  instruments, 
  cartItems, 
  addToCart,
  updateCart
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('All');
  const [sortBy, setSortBy] = useState('name');
  const [showFilters, setShowFilters] = useState(false);

  const instrumentTypes = ['All', 'Acoustic Guitar', 'Electric Guitar', 'Electronic Drums', 'Digital Piano', 'Bass Guitar', 'Synthesizer'];

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
            <p className="text-base sm:text-lg md:text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
              Discover premium musical instruments for rent. Perfect for events, practice sessions, or trying before you buy.
            </p>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="px-4 pb-6 sm:pb-8">
        <div className="max-w-4xl mx-auto">
          {/* Search Bar */}
          <div className="relative mb-4 sm:mb-6">
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
              className="flex items-center gap-2 px-4 py-2 bg-indigo-100 text-indigo-700 rounded-lg font-medium text-sm hover:bg-indigo-200 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707v4.586l-4-2v-2.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
              Filters
            </button>
          </div>

          {/* Filters */}
          {showFilters && (
            <div className="mb-6 p-4 bg-white/60 backdrop-blur-sm rounded-xl border border-indigo-200 shadow-sm">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-indigo-700 mb-2">Instrument Type</label>
                  <select
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                    className="w-full px-3 py-2.5 bg-white border border-indigo-200 rounded-lg text-gray-800 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-200 text-sm"
                  >
                    {instrumentTypes.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-indigo-700 mb-2">Sort By</label>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="w-full px-3 py-2.5 bg-white border border-indigo-200 rounded-lg text-gray-800 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-200 text-sm"
                  >
                    <option value="name">Name</option>
                    <option value="price">Price</option>
                    <option value="type">Type</option>
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
                  instrumentId={instrument.id}
                  imageUrl={instrument.imageUrl}
                  name={instrument.name}
                  type={instrument.type}
                  pricePerDay={instrument.pricePerDay}
                  availabilityStatus={instrument.availabilityStatus}
                  isInCart={cartItems.some(item => item.id === instrument.id)}
                  cartItems={cartItems}
                  addToCart={addToCart}
                  updateCart={updateCart}
                  vendor={instrument.vendor}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 sm:py-16 px-4">
              <div className="text-4xl sm:text-6xl mb-3 sm:mb-4">🎵</div>
              <h3 className="text-xl sm:text-2xl font-bold text-indigo-600 mb-2">No instruments found</h3>
              <p className="text-gray-600 mb-4 sm:mb-6">Try adjusting your search or filter criteria</p>
              <button 
                onClick={() => {
                  setSearchTerm('');
                  setFilterType('All');
                }}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-6 rounded-lg transition-all duration-300"
              >
                Clear Filters
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default InstrumentsSection;