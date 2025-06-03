import React from 'react';
import { Search, TrendingUp } from 'lucide-react';

const QuickSearch = ({ onSearch, className = '' }) => {
  const popularSearches = [
    'apple', 'banana', 'chicken breast', 'salmon', 'quinoa', 
    'avocado', 'spinach', 'almonds', 'greek yogurt', 'sweet potato'
  ];

  const categories = [
    { name: 'Fruits', icon: '🍎', searches: ['apple', 'banana', 'orange', 'strawberry'] },
    { name: 'Proteins', icon: '🍗', searches: ['chicken breast', 'salmon', 'eggs', 'tofu'] },
    { name: 'Vegetables', icon: '🥬', searches: ['spinach', 'broccoli', 'carrot', 'sweet potato'] },
    { name: 'Grains', icon: '🌾', searches: ['quinoa', 'rice', 'oats', 'bread'] }
  ];

  return (
    <div className={`bg-white rounded-xl border border-gray-200 p-6 ${className}`}>
      <div className="flex items-center mb-4">
        <TrendingUp className="h-5 w-5 text-primary-600 mr-2" />
        <h3 className="text-lg font-semibold text-gray-900">Popular Searches</h3>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {categories.map((category) => (
          <div key={category.name} className="space-y-2">
            <div className="flex items-center text-sm font-medium text-gray-700 mb-2">
              <span className="mr-2">{category.icon}</span>
              {category.name}
            </div>
            <div className="space-y-1">
              {category.searches.map((search) => (
                <button
                  key={search}
                  onClick={() => onSearch(search)}
                  className="block w-full text-left px-3 py-2 text-sm text-gray-600 
                    hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors
                    border border-transparent hover:border-primary-200"
                >
                  <Search className="h-3 w-3 inline mr-2" />
                  {search}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
      
      <div className="mt-6 pt-4 border-t border-gray-100">
        <p className="text-xs text-gray-500 text-center">
          Click any item above to search, or use the search bar to find specific foods
        </p>
      </div>
    </div>
  );
};

export default QuickSearch;
