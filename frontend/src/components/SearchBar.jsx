import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Search, X } from 'lucide-react';

const SearchBar = ({ onSearch, onClear, isLoading }) => {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [lastSearchedQuery, setLastSearchedQuery] = useState('');
  const debounceTimeoutRef = useRef(null);
  const abortControllerRef = useRef(null);
  const lastSearchedRef = useRef(''); // Additional ref to prevent re-renders

  // Improved debounced search function with duplicate prevention
  const debouncedSearch = useCallback(
    (searchQuery) => {
      // Clear existing timeout
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }

      // Cancel previous request if still pending
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      debounceTimeoutRef.current = setTimeout(() => {
        const trimmedQuery = searchQuery.trim();
        
        // Only search if:
        // 1. Query is at least 3 characters
        // 2. Query is different from last searched query (using ref for consistency)
        // 3. Not currently loading
        if (
          trimmedQuery.length >= 3 && 
          trimmedQuery !== lastSearchedRef.current && 
          !isLoading
        ) {
          lastSearchedRef.current = trimmedQuery;
          setLastSearchedQuery(trimmedQuery);
          
          // Create new abort controller for this request
          abortControllerRef.current = new AbortController();
          
          onSearch(trimmedQuery, abortControllerRef.current.signal);
        }
      }, 1000); // Increased debounce time to 1000ms (1 second)
    },
    [onSearch, isLoading] // Removed lastSearchedQuery from dependencies to prevent re-creation
  );

  useEffect(() => {
    if (query) {
      debouncedSearch(query);
    } else {
      // Clear results when query is empty
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
      if (lastSearchedRef.current) {
        lastSearchedRef.current = '';
        setLastSearchedQuery('');
        onClear();
      }
    }

    // Cleanup on unmount
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [query, debouncedSearch, onClear, lastSearchedQuery]);

  const handleInputChange = (e) => {
    const newValue = e.target.value;
    setQuery(newValue);
  };

  const handleClear = () => {
    setQuery('');
    setSuggestions([]);
    setLastSearchedQuery('');
    lastSearchedRef.current = ''; // Also clear the ref
    
    // Clear any pending timeouts and requests
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    onClear();
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && query.trim()) {
      // Cancel debounced search and search immediately
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
      
      // Cancel previous request if still pending
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      
      const trimmedQuery = query.trim();
      if (trimmedQuery.length >= 3 && trimmedQuery !== lastSearchedRef.current) {
        lastSearchedRef.current = trimmedQuery;
        setLastSearchedQuery(trimmedQuery);
        
        // Create new abort controller for this request
        abortControllerRef.current = new AbortController();
        
        onSearch(trimmedQuery, abortControllerRef.current.signal);
      }
    }
  };

  return (
    <div className="relative w-full max-w-2xl mx-auto">
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          <Search className={`h-5 w-5 transition-colors ${isLoading ? 'text-primary-500 animate-pulse' : 'text-gray-400'}`} />
        </div>
        
        <input
          type="text"
          value={query}
          onChange={handleInputChange}
          onKeyPress={handleKeyPress}
          placeholder="Search for any food item... (e.g., banana, chicken breast, quinoa)"
          className="w-full pl-12 pr-12 py-4 text-lg border-2 border-gray-200 rounded-2xl focus:border-primary-500 focus:ring-0 outline-none transition-all duration-200 bg-white shadow-sm hover:shadow-md"
          disabled={isLoading}
        />
        
        {query && (
          <button
            onClick={handleClear}
            className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>
      
      {isLoading && (
        <div className="absolute top-full left-0 right-0 mt-2 p-3 bg-white rounded-lg shadow-md border">
          <div className="flex items-center text-sm text-gray-600">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-500 mr-2"></div>
            Searching for nutritional data...
          </div>
        </div>
      )}
    </div>
  );
};

// Debounce utility function
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

export default SearchBar;
