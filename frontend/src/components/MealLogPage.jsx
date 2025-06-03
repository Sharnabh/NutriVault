import React, { useEffect, useState } from 'react';
import { nutritionAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

const MEAL_TYPES = {
  breakfast: 'Breakfast',
  lunch: 'Lunch',
  dinner: 'Dinner',
  snack: 'Snack',
  other: 'Other'
};

const getSummary = (meals) => {
  let calories = 0, protein = 0, carbs = 0, fat = 0;
  meals.forEach(m => {
    calories += Number(m.calories) || 0;
    protein += Number(m.protein) || 0;
    carbs += Number(m.carbs) || 0;
    fat += Number(m.fat) || 0;
  });
  return {
    calories: Math.round(calories),
    protein: Math.round(protein),
    carbs: Math.round(carbs),
    fat: Math.round(fat)
  };
};

const getMealTypeSummary = (meals) => {
  const summary = {};
  Object.keys(MEAL_TYPES).forEach(type => {
    const typeMeals = meals.filter(m => m.meal_type === type);
    summary[type] = {
      count: typeMeals.length,
      ...getSummary(typeMeals)
    };
  });
  return summary;
};

const MealLogPage = ({ onBack }) => {
  const { user } = useAuth();
  const [meals, setMeals] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleteId, setDeleteId] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [editMeal, setEditMeal] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editError, setEditError] = useState('');
  const [selectedMealType, setSelectedMealType] = useState('all');
  const [selectedIds, setSelectedIds] = useState([]);
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const fetchMeals = async () => {
    if (!user) return;
    setIsLoading(true);
    setError('');
    try {
      const token = await user.getIdToken();
      const response = await nutritionAPI.getMeals(token, { days: 30 });
      if (response.success) {
        setMeals(response.meals);
      } else {
        setError('Failed to fetch meals');
      }
    } catch (err) {
      setError('Failed to fetch meals');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMeals();
    // eslint-disable-next-line
  }, [user]);

  const handleDelete = async (mealId) => {
    if (!user) return;
    setIsDeleting(true);
    try {
      const token = await user.getIdToken();
      await nutritionAPI.deleteMeal(token, mealId);
      setMeals(meals.filter(m => m.id !== mealId));
    } catch (err) {
      alert('Failed to delete meal');
    } finally {
      setIsDeleting(false);
      setDeleteId(null);
    }
  };

  const handleEdit = async (e) => {
    e.preventDefault();
    if (!user || !editMeal) return;

    setIsEditing(true);
    setEditError('');

    try {
      const token = await user.getIdToken();
      const response = await nutritionAPI.updateMeal(token, editMeal.id, {
        serving_size: parseFloat(editMeal.serving_size),
        serving_unit: editMeal.serving_unit,
        calories: editMeal.calories,
        protein: editMeal.protein,
        carbs: editMeal.carbs,
        fat: editMeal.fat,
        meal_type: editMeal.meal_type,
        logged_date: editMeal.logged_date
      });

      if (response.success) {
        setMeals(meals.map(m => m.id === editMeal.id ? editMeal : m));
        setEditMeal(null);
      } else {
        setEditError(response.error || 'Failed to update meal');
      }
    } catch (err) {
      setEditError('Failed to update meal');
    } finally {
      setIsEditing(false);
    }
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditMeal(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Filter meals by meal type, date range, and search term
  const filteredMeals = meals
    .filter(meal => selectedMealType === 'all' || meal.meal_type === selectedMealType)
    .filter(meal => {
      if (dateFrom && meal.logged_date < dateFrom) return false;
      if (dateTo && meal.logged_date > dateTo) return false;
      return true;
    })
    .filter(meal =>
      meal.food_name.toLowerCase().includes(searchTerm.trim().toLowerCase())
    );

  const summary = getSummary(meals);
  const mealTypeSummary = getMealTypeSummary(meals);

  const handleSelect = (mealId) => {
    setSelectedIds((prev) =>
      prev.includes(mealId) ? prev.filter(id => id !== mealId) : [...prev, mealId]
    );
  };

  const handleSelectAll = () => {
    if (selectedIds.length === filteredMeals.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredMeals.map(m => m.id));
    }
  };

  const handleBulkDelete = async () => {
    if (!user || selectedIds.length === 0) return;
    setIsDeleting(true);
    try {
      const token = await user.getIdToken();
      await Promise.all(selectedIds.map(id => nutritionAPI.deleteMeal(token, id)));
      setMeals(meals.filter(m => !selectedIds.includes(m.id)));
      setSelectedIds([]);
    } catch (err) {
      alert('Failed to delete selected meals');
    } finally {
      setIsDeleting(false);
      setShowBulkDeleteConfirm(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">My Meal Log</h2>
        <button onClick={onBack} className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300">Back</button>
      </div>

      {/* Meal Type Filter */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">Filter by Meal Type</label>
        <select
          value={selectedMealType}
          onChange={(e) => setSelectedMealType(e.target.value)}
          className="w-full md:w-64 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="all">All Meals</option>
          {Object.entries(MEAL_TYPES).map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
      </div>

      {/* Filters: Date Range & Search */}
      <div className="flex flex-col md:flex-row md:items-end md:space-x-4 mb-6 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">From</label>
          <input
            type="date"
            value={dateFrom}
            onChange={e => setDateFrom(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">To</label>
          <input
            type="date"
            value={dateTo}
            onChange={e => setDateTo(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 mb-1">Search Food</label>
          <input
            type="text"
            placeholder="Search by food name..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>

      {/* Overall Nutrition Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-lg p-4 text-center shadow">
          <div className="text-2xl font-bold text-blue-600">{summary.calories}</div>
          <div className="text-sm text-gray-600">Total Calories</div>
        </div>
        <div className="bg-white rounded-lg p-4 text-center shadow">
          <div className="text-2xl font-bold text-green-600">{summary.protein}g</div>
          <div className="text-sm text-gray-600">Total Protein</div>
        </div>
        <div className="bg-white rounded-lg p-4 text-center shadow">
          <div className="text-2xl font-bold text-yellow-600">{summary.carbs}g</div>
          <div className="text-sm text-gray-600">Total Carbs</div>
        </div>
        <div className="bg-white rounded-lg p-4 text-center shadow">
          <div className="text-2xl font-bold text-red-600">{summary.fat}g</div>
          <div className="text-sm text-gray-600">Total Fat</div>
        </div>
      </div>

      {/* Meal Type Breakdown */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold mb-4">Meal Type Breakdown</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Object.entries(MEAL_TYPES).map(([type, label]) => (
            <div key={type} className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200">
              <div className="p-4 border-b border-gray-100">
                <div className="flex justify-between items-center">
                  <h4 className="font-medium text-gray-900">{label}</h4>
                  <span className="px-2 py-1 bg-blue-50 text-blue-600 text-sm rounded-full">
                    {mealTypeSummary[type].count} meals
                  </span>
                </div>
              </div>
              <div className="p-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Calories</span>
                    <span className="font-medium text-blue-600">{mealTypeSummary[type].calories}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Protein</span>
                    <span className="font-medium text-green-600">{mealTypeSummary[type].protein}g</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Carbs</span>
                    <span className="font-medium text-yellow-600">{mealTypeSummary[type].carbs}g</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Fat</span>
                    <span className="font-medium text-red-600">{mealTypeSummary[type].fat}g</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Meals Table */}
      {isLoading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading meals...</p>
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
          {error}
        </div>
      ) : filteredMeals.length === 0 ? (
        <div className="text-center py-8 bg-white rounded-lg shadow">
          <p className="text-gray-600">No meals found.</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {selectedIds.length > 0 && (
            <div className="flex items-center justify-between px-4 py-2 bg-red-50 border-b border-red-100">
              <span className="text-red-700 font-medium">{selectedIds.length} selected</span>
              <button
                onClick={() => setShowBulkDeleteConfirm(true)}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
                disabled={isDeleting}
              >
                {isDeleting ? 'Deleting...' : 'Delete Selected'}
              </button>
            </div>
          )}
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selectedIds.length === filteredMeals.length && filteredMeals.length > 0}
                      onChange={handleSelectAll}
                      aria-label="Select all meals"
                    />
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Meal Type
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Food
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Serving
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Calories
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Protein
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Carbs
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fat
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredMeals.map((meal) => (
                  <tr key={meal.id} className="hover:bg-gray-50 transition-colors duration-150">
                    <td className="px-4 py-4 text-center">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(meal.id)}
                        onChange={() => handleSelect(meal.id)}
                        aria-label={`Select meal ${meal.food_name}`}
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {meal.logged_date}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-50 text-blue-600">
                        {MEAL_TYPES[meal.meal_type] || 'Other'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {meal.food_name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {meal.serving_size} {meal.serving_unit}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600 font-medium">
                      {Math.round(meal.calories)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 font-medium">
                      {Math.round(meal.protein)}g
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-yellow-600 font-medium">
                      {Math.round(meal.carbs)}g
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600 font-medium">
                      {Math.round(meal.fat)}g
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium min-w-[80px] flex gap-2 justify-end items-center">
                      <button 
                        onClick={() => setEditMeal(meal)}
                        className="text-blue-600 hover:text-blue-900 transition-colors duration-150 px-2 py-1 rounded focus:outline-none focus:ring-2 focus:ring-blue-200"
                      >
                        Edit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {deleteId && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50">
          <div className="bg-white rounded-lg shadow-lg p-8 max-w-sm w-full">
            <h3 className="text-lg font-semibold mb-4">Delete Meal</h3>
            <p className="mb-6">Are you sure you want to delete this meal? This action cannot be undone.</p>
            <div className="flex justify-end space-x-3">
              <button
                className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
                onClick={() => setDeleteId(null)}
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                onClick={() => handleDelete(deleteId)}
                disabled={isDeleting}
              >
                {isDeleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editMeal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50">
          <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full">
            <h3 className="text-lg font-semibold mb-4">Edit Meal</h3>
            {editError && (
              <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-md">
                {editError}
              </div>
            )}
            <form onSubmit={handleEdit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Food Name
                </label>
                <input
                  type="text"
                  value={editMeal.food_name}
                  disabled
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-md"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Serving Size
                </label>
                <input
                  type="number"
                  name="serving_size"
                  value={editMeal.serving_size}
                  onChange={handleEditChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  min="0.1"
                  step="0.1"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Serving Unit
                </label>
                <select
                  name="serving_unit"
                  value={editMeal.serving_unit}
                  onChange={handleEditChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                >
                  <option value="g">Grams (g)</option>
                  <option value="oz">Ounces (oz)</option>
                  <option value="ml">Milliliters (ml)</option>
                  <option value="cup">Cups</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Meal Type
                </label>
                <select
                  name="meal_type"
                  value={editMeal.meal_type}
                  onChange={handleEditChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                >
                  {Object.entries(MEAL_TYPES).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date
                </label>
                <input
                  type="date"
                  name="logged_date"
                  value={editMeal.logged_date}
                  onChange={handleEditChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setEditMeal(null)}
                  className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
                  disabled={isEditing}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                  disabled={isEditing}
                >
                  {isEditing ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bulk Delete Confirmation Dialog */}
      {showBulkDeleteConfirm && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50">
          <div className="bg-white rounded-lg shadow-lg p-8 max-w-sm w-full">
            <h3 className="text-lg font-semibold mb-4">Delete Selected Meals</h3>
            <p className="mb-6">Are you sure you want to delete {selectedIds.length} selected meal{selectedIds.length > 1 ? 's' : ''}? This action cannot be undone.</p>
            <div className="flex justify-end space-x-3">
              <button
                className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
                onClick={() => setShowBulkDeleteConfirm(false)}
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                onClick={handleBulkDelete}
                disabled={isDeleting}
              >
                {isDeleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MealLogPage; 