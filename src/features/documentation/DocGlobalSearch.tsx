// src/features/documentation/DocGlobalSearch.tsx
import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../../store';
import { searchDocClients, clearDocClientsSearch } from '../../store/slices/docClientsSlice';
import { Search, Calendar, X, Filter } from 'lucide-react';

const DocGlobalSearch: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { searchActive, isSearching } = useSelector((state: RootState) => state.docClients);

  const [query, setQuery] = useState('');
  const [period, setPeriod] = useState('ALL');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  const handleSearch = () => {
    if (!query && period === 'ALL') {
      dispatch(clearDocClientsSearch());
      return;
    }

    const payload = {
      query: query.trim(),
      period,
      fromDate: period === 'CUSTOM' ? fromDate : undefined,
      toDate: period === 'CUSTOM' ? toDate : undefined,
      page: 0,
      size: 50 // Fetching 50 by default to apply frontend status filtering easily
    };

    dispatch(searchDocClients(payload));
  };

  const handleClear = () => {
    setQuery('');
    setPeriod('ALL');
    setFromDate('');
    setToDate('');
    dispatch(clearDocClientsSearch());
  };

  return (
    <div className="flex flex-col xl:flex-row items-center gap-3 w-full xl:w-auto bg-white p-2 rounded-2xl sm:rounded-full border border-gray-200 shadow-sm flex-wrap">
      
      {/* Search Input */}
      <div className="relative w-full xl:w-56 shrink-0">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input 
          type="text" 
          placeholder="Client ID or Name..." 
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          className="w-full pl-9 pr-4 py-2 bg-transparent text-sm focus:outline-none placeholder-gray-400"
        />
      </div>

      <div className="hidden xl:block w-px h-6 bg-gray-200"></div>

      {/* Period Dropdown */}
      <div className="flex items-center gap-2 w-full xl:w-auto shrink-0 px-2">
        <Filter className="w-4 h-4 text-gray-400" />
        <select 
          value={period}
          onChange={(e) => setPeriod(e.target.value)}
          className="bg-transparent text-sm font-medium text-gray-700 focus:outline-none cursor-pointer w-full xl:w-auto"
        >
          <option value="ALL">All Time</option>
          <option value="TODAY">Today</option>
          <option value="THIS_WEEK">This Week</option>
          <option value="THIS_MONTH">This Month</option>
          <option value="CUSTOM">Custom Date</option>
        </select>
      </div>

      {/* Custom Dates (Conditional) */}
      {period === 'CUSTOM' && (
        <div className="flex items-center gap-2 w-full xl:w-auto px-2 animate-in fade-in slide-in-from-left-2">
          <div className="hidden xl:block w-px h-6 bg-gray-200"></div>
          <Calendar className="w-4 h-4 text-gray-400" />
          <input 
            type="date" 
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            className="bg-transparent text-sm text-gray-600 focus:outline-none"
          />
          <span className="text-gray-400 text-xs font-bold">TO</span>
          <input 
            type="date" 
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            className="bg-transparent text-sm text-gray-600 focus:outline-none"
          />
        </div>
      )}

      <div className="hidden xl:block w-px h-6 bg-gray-200"></div>

      {/* Actions */}
      <div className="flex items-center gap-2 w-full xl:w-auto pl-2 pr-1 pb-1 xl:pb-0 justify-end">
        {searchActive && (
          <button 
            onClick={handleClear}
            className="flex items-center justify-center min-h-[36px] px-4 rounded-full text-xs font-bold text-gray-500 hover:text-gray-800 hover:bg-gray-100 transition-colors"
          >
            Clear
          </button>
        )}
        <button 
          onClick={handleSearch}
          disabled={isSearching}
          className="flex items-center justify-center min-h-[36px] px-5 bg-[#5f41b2] text-white rounded-full text-xs font-bold hover:bg-[#4d3396] transition-colors disabled:opacity-50 shadow-sm"
        >
          {isSearching ? 'Searching...' : 'Search'}
        </button>
      </div>
    </div>
  );
};

export default DocGlobalSearch;