import React, { useState } from 'react';
import { X, Plus, Utensils, Calendar } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { nutritionAPI } from '../services/api';

const MealLogModal = ({ isOpen, onClose, food, nutritionData }) => {
  const { user } = useAuth();
  const [servingSize, setServingSize] = useState(100);
  const [mealDate, setMealDate] = useState(new Date().toISOString().split('T')[0]);
  const [isLogging, setIsLogging] = useState(false);
  const [error, setError] = useState('');

  // Calculate nutrition values based on serving size
  const getMacro = (key) => nutritionData?.macronutrients?.[key]?.amount ?? 0;
  const calculateNutrition = (macroKey, baseAmount = 100) => {
    const value = getMacro(macroKey);
    if (!nutritionData || value === undefined || value === null) return 0;
    return (value * servingSize) / baseAmount;
  };

  const handleLogMeal = async () => {
    if (!user || !food || !nutritionData) {
      setError('Missing required information');
      return;
    }

    setIsLogging(true);
    setError('');

    try {
      const token = await user.getIdToken();
      
      // Prepare meal data
      const mealData = {
        fdc_id: food.fdcId,
        food_name: food.description,
        serving_size: parseFloat(servingSize),
        serving_unit: 'g',  // Default to grams
        calories: calculateNutrition('calories'),
        protein: calculateNutrition('protein'),
        carbs: calculateNutrition('carbohydrates'),
        fat: calculateNutrition('fat'),
        meal_type: 'other',  // Default meal type
        logged_date: mealDate
      };

      const response = await nutritionAPI.logMeal(token, mealData);

      if (response.success) {
        onClose();
        // You could emit an event or call a callback to refresh nutrition summary
      } else {
        setError(response.error || 'Failed to log meal');
      }
    } catch (error) {
      setError('An error occurred while logging the meal');
      console.error('Meal logging error:', error);
    } finally {
      setIsLogging(false);
    }
  };

  if (!isOpen || !food || !nutritionData) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
              <Utensils size={20} className="text-green-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900">Log Meal</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
              {error}
            </div>
          )}

          {/* Food Info */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-medium text-gray-900 mb-2">{food.description}</h3>
            <p className="text-sm text-gray-600">
              Brand: {food.brandOwner || 'Generic'}
            </p>
            {food.packageWeight && (
              <p className="text-sm text-gray-600">
                Package Size: {food.packageWeight}
              </p>
            )}
          </div>

          {/* Serving Size Input */}
          <div>
            <label htmlFor="servingSize" className="block text-sm font-medium text-gray-700 mb-1">
              Serving Size (grams)
            </label>
            <input
              type="number"
              id="servingSize"
              value={servingSize}
              onChange={(e) => setServingSize(Math.max(1, parseFloat(e.target.value) || 1))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500"
              min="1"
              step="0.1"
            />
          </div>

          {/* Date Input */}
          <div>
            <label htmlFor="mealDate" className="block text-sm font-medium text-gray-700 mb-1">
              Meal Date
            </label>
            <div className="relative">
              <Calendar size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="date"
                id="mealDate"
                value={mealDate}
                onChange={(e) => setMealDate(e.target.value)}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500"
              />
            </div>
          </div>

          {/* Calculated Nutrition */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-3">Nutrition for {servingSize}g</h4>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Calories:</span>
                <span className="font-medium">{Math.round(calculateNutrition('calories'))}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Protein:</span>
                <span className="font-medium">{Math.round(calculateNutrition('protein') * 10) / 10}g</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Carbs:</span>
                <span className="font-medium">{Math.round(calculateNutrition('carbohydrates') * 10) / 10}g</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Fat:</span>
                <span className="font-medium">{Math.round(calculateNutrition('fat') * 10) / 10}g</span>
              </div>
              {/* Optionally add fiber, sugar, sodium if present in micronutrients/otherNutrients */}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-3 pt-4">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleLogMeal}
              disabled={isLogging || !user}
              className="flex-1 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLogging ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Logging...
                </div>
              ) : (
                <div className="flex items-center justify-center">
                  <Plus size={16} className="mr-2" />
                  Log Meal
                </div>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MealLogModal;
