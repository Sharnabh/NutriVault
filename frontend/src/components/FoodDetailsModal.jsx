import React from 'react';
import { X, Apple, Zap, Activity, Info, Plus } from 'lucide-react';
import NutritionChart from './NutritionChart';

const FoodDetailsModal = ({ food, nutritionData, isOpen, onClose, onLogMeal, user }) => {
  if (!isOpen || !food) return null;

  const renderNutrientValue = (nutrient) => {
    if (!nutrient || nutrient.amount === undefined) return 'N/A';
    const value = typeof nutrient.amount === 'number' ? nutrient.amount.toFixed(1) : nutrient.amount;
    return `${value} ${nutrient.unit || ''}`;
  };

  const renderServingInfo = () => {
    if (!nutritionData) return null;
    
    const { servingSize, servingSizeUnit, householdServingFullText } = nutritionData;
    
    return (
      <div className="bg-blue-50 rounded-lg p-4 mb-6">
        <h4 className="font-semibold text-blue-900 mb-2 flex items-center">
          <Info className="h-4 w-4 mr-2" />
          Serving Information
        </h4>
        <div className="space-y-1 text-sm text-blue-800">
          {servingSize && servingSizeUnit && (
            <p>Standard serving: {servingSize} {servingSizeUnit}</p>
          )}
          {householdServingFullText && (
            <p>Household serving: {householdServingFullText}</p>
          )}
          <p className="text-xs text-blue-600 mt-2">
            All values shown are per 100g unless otherwise specified
          </p>
        </div>
      </div>
    );
  };

  const renderMacronutrients = () => {
    if (!nutritionData?.macronutrients) return null;

    const { calories, protein, carbohydrates, fat } = nutritionData.macronutrients;

    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-primary-50 rounded-lg p-4 text-center">
          <Zap className="h-6 w-6 text-primary-600 mx-auto mb-2" />
          <div className="text-2xl font-bold text-primary-700">
            {calories ? Math.round(calories.amount) : 'N/A'}
          </div>
          <div className="text-sm text-primary-600">Calories</div>
        </div>
        
        <div className="bg-red-50 rounded-lg p-4 text-center">
          <Activity className="h-6 w-6 text-red-600 mx-auto mb-2" />
          <div className="text-2xl font-bold text-red-700">
            {protein ? protein.amount.toFixed(1) : 'N/A'}
          </div>
          <div className="text-sm text-red-600">Protein (g)</div>
        </div>
        
        <div className="bg-blue-50 rounded-lg p-4 text-center">
          <Apple className="h-6 w-6 text-blue-600 mx-auto mb-2" />
          <div className="text-2xl font-bold text-blue-700">
            {carbohydrates ? carbohydrates.amount.toFixed(1) : 'N/A'}
          </div>
          <div className="text-sm text-blue-600">Carbs (g)</div>
        </div>
        
        <div className="bg-yellow-50 rounded-lg p-4 text-center">
          <div className="w-6 h-6 bg-yellow-600 rounded-full mx-auto mb-2"></div>
          <div className="text-2xl font-bold text-yellow-700">
            {fat ? fat.amount.toFixed(1) : 'N/A'}
          </div>
          <div className="text-sm text-yellow-600">Fat (g)</div>
        </div>
      </div>
    );
  };

  const renderMicronutrients = () => {
    if (!nutritionData?.micronutrients || Object.keys(nutritionData.micronutrients).length === 0) {
      return (
        <div className="text-center text-gray-500 py-8">
          <p>No micronutrient data available</p>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {Object.entries(nutritionData.micronutrients).map(([key, nutrient]) => (
          <div key={key} className="flex justify-between items-center py-3 px-4 bg-gray-50 rounded-lg">
            <span className="text-sm font-medium text-gray-700">
              {nutrient.name.replace(/^[^,]+,\s*/, '')}
            </span>
            <span className="text-sm text-gray-900 font-semibold">
              {renderNutrientValue(nutrient)}
            </span>
          </div>
        ))}
      </div>
    );
  };

  const renderOtherNutrients = () => {
    if (!nutritionData?.otherNutrients || Object.keys(nutritionData.otherNutrients).length === 0) {
      return null;
    }

    const importantNutrients = Object.entries(nutritionData.otherNutrients)
      .filter(([key, nutrient]) => {
        const name = nutrient.name.toLowerCase();
        return name.includes('fiber') || name.includes('sugar') || name.includes('sodium') || 
               name.includes('cholesterol') || name.includes('saturated');
      })
      .slice(0, 8);

    if (importantNutrients.length === 0) return null;

    return (
      <div className="mt-6">
        <h4 className="text-lg font-semibold text-gray-900 mb-4">Additional Nutrients</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {importantNutrients.map(([key, nutrient]) => (
            <div key={key} className="flex justify-between items-center py-2 px-3 bg-gray-50 rounded">
              <span className="text-sm text-gray-700">
                {nutrient.name.replace(/^[^,]+,\s*/, '')}
              </span>
              <span className="text-sm font-medium text-gray-900">
                {renderNutrientValue(nutrient)}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-bold text-gray-900 truncate">
              {food.description}
            </h2>
            {nutritionData?.brandOwner && (
              <p className="text-sm text-gray-600 mt-1">{nutritionData.brandOwner}</p>
            )}
          </div>
          <div className="flex items-center space-x-2">
            {/* Log Meal Button */}
            {user && nutritionData && (
              <button
                onClick={onLogMeal}
                className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
              >
                <Plus size={16} />
                <span>Log Meal</span>
              </button>
            )}
            {/* Close Button */}
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-200 rounded-full transition-colors"
            >
              <X className="h-5 w-5 text-gray-500" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {!nutritionData ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading nutritional data...</p>
            </div>
          ) : (
            <div className="space-y-6">
              {renderServingInfo()}
              {renderMacronutrients()}
              
              {/* Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <NutritionChart nutritionData={nutritionData} chartType="pie" />
                <NutritionChart nutritionData={nutritionData} chartType="bar" />
              </div>
              
              {/* Micronutrients */}
              <div>
                <h4 className="text-lg font-semibold text-gray-900 mb-4">Vitamins & Minerals</h4>
                {renderMicronutrients()}
              </div>
              
              {/* Other Important Nutrients */}
              {renderOtherNutrients()}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FoodDetailsModal;
