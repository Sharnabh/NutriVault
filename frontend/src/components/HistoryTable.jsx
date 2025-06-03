import React from 'react';
import { Clock, Trash2, Eye } from 'lucide-react';

const HistoryTable = ({ history, onViewDetails, onClearHistory }) => {
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now - date) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getCalories = (nutritionData) => {
    if (!nutritionData?.macronutrients?.calories) return 'N/A';
    return Math.round(nutritionData.macronutrients.calories.amount);
  };

  if (!history || history.length === 0) {
    return (
      <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-200 text-center">
        <Clock className="h-12 w-12 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">No Search History</h3>
        <p className="text-gray-500">Start searching for foods to see your recent searches here.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="px-6 py-4 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
        <div className="flex items-center">
          <Clock className="h-5 w-5 text-gray-500 mr-2" />
          <h3 className="text-lg font-semibold text-gray-900">Recent Searches</h3>
          <span className="ml-2 text-sm text-gray-500">({history.length})</span>
        </div>
        {history.length > 0 && (
          <button
            onClick={onClearHistory}
            className="flex items-center text-sm text-red-600 hover:text-red-700 transition-colors"
          >
            <Trash2 className="h-4 w-4 mr-1" />
            Clear All
          </button>
        )}
      </div>
      
      <div className="divide-y divide-gray-100">
        {history.map((item, index) => (
          <div key={index} className="px-6 py-4 hover:bg-gray-50 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-medium text-gray-900 truncate">
                  {item.foodName}
                </h4>
                <div className="flex items-center mt-1 text-xs text-gray-500">
                  <span>{formatDate(item.searchedAt)}</span>
                  {item.nutritionData && (
                    <>
                      <span className="mx-2">•</span>
                      <span>{getCalories(item.nutritionData)} kcal</span>
                    </>
                  )}
                </div>
              </div>
              
              <div className="flex items-center space-x-2 ml-4">
                {item.nutritionData && (
                  <div className="flex items-center text-xs text-gray-500">
                    <div className="flex space-x-3">
                      <span className="px-2 py-1 bg-red-100 text-red-700 rounded">
                        P: {Math.round(item.nutritionData.macronutrients?.protein?.amount || 0)}g
                      </span>
                      <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded">
                        C: {Math.round(item.nutritionData.macronutrients?.carbohydrates?.amount || 0)}g
                      </span>
                      <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded">
                        F: {Math.round(item.nutritionData.macronutrients?.fat?.amount || 0)}g
                      </span>
                    </div>
                  </div>
                )}
                
                <button
                  onClick={() => onViewDetails({ fdcId: item.fdcId, description: item.foodName })}
                  className="flex items-center text-primary-600 hover:text-primary-700 text-sm font-medium transition-colors"
                >
                  <Eye className="h-4 w-4 mr-1" />
                  View
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {history.length >= 10 && (
        <div className="px-6 py-3 bg-gray-50 border-t border-gray-200 text-center">
          <p className="text-xs text-gray-500">
            Showing latest {history.length} searches • Older searches are automatically removed
          </p>
        </div>
      )}
    </div>
  );
};

export default HistoryTable;
