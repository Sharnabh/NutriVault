import React, { useState, useEffect } from 'react';
import { User, Target, Calendar, Download, Plus, Edit3, Save, X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { nutritionAPI } from '../services/api';

const UserDashboard = ({ isOpen, onClose }) => {
  const { user, userProfile, logout, refreshUserProfile } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const [isEditing, setIsEditing] = useState(false);
  const [editProfile, setEditProfile] = useState({
    age: '',
    weight: '',
    height: '',
    activity_level: 'moderate',
    dietary_goal: 'maintain'
  });
  const [nutritionSummary, setNutritionSummary] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [toast, setToast] = useState({ message: '', type: '', visible: false });

  useEffect(() => {
    if (userProfile) {
      setEditProfile({
        age: userProfile.age || '',
        weight: userProfile.weight || '',
        height: userProfile.height || '',
        activity_level: userProfile.activity_level || 'moderate',
        dietary_goal: userProfile.dietary_goal || 'maintain'
      });
    }
    loadNutritionSummary();
  }, [userProfile]);

  const loadNutritionSummary = async () => {
    try {
      if (user) {
        const token = await user.getIdToken();
        const response = await nutritionAPI.getNutritionSummary(token);
        if (response.success) {
          setNutritionSummary(response.summary);
        }
      }
    } catch (error) {
      console.error('Failed to load nutrition summary:', error);
    }
  };

  const showToast = (message, type = 'info') => {
    setToast({ message, type, visible: true });
    setTimeout(() => setToast({ message: '', type: '', visible: false }), 3000);
  };

  const handleProfileUpdate = async () => {
    setIsLoading(true);
    try {
      const token = await user.getIdToken();
      const response = await nutritionAPI.updateUserProfile(token, editProfile);
      
      if (response.success) {
        // Set dietary goals after profile update
        await nutritionAPI.setDietaryGoals(token, {
          goal_type: editProfile.dietary_goal,
          current_weight: Number(editProfile.weight),
          target_weight: Number(editProfile.weight), // You can add a separate field if needed
          activity_level: editProfile.activity_level
        });
        setIsEditing(false);
        showToast('Profile and goals updated successfully!', 'success');
        // Refresh the user profile to show updated data
        await refreshUserProfile();
      } else {
        showToast('Failed to update profile', 'error');
      }
    } catch (error) {
      console.error('Profile update error:', error);
      showToast('An error occurred while updating profile', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportPDF = async () => {
    try {
      const token = await user.getIdToken();
      const response = await nutritionAPI.exportPDF(token);
      
      if (response.success) {
        // Create a blob from the PDF data and trigger download
        const blob = new Blob([response.pdf], { type: 'application/pdf' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `nutrivault-report-${new Date().toISOString().split('T')[0]}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        showToast('PDF report downloaded successfully!', 'success');
      } else {
        showToast('Failed to generate PDF report', 'error');
      }
    } catch (error) {
      showToast('An error occurred while generating PDF', 'error');
    }
  };

  const calculateProgress = (current, target) => {
    if (!target || target === 0) return 0;
    return Math.min((current / target) * 100, 100);
  };

  const activityLevels = {
    sedentary: 'Sedentary (little to no exercise)',
    light: 'Lightly Active (light exercise 1-3 days/week)',
    moderate: 'Moderately Active (moderate exercise 3-5 days/week)',
    very: 'Very Active (hard exercise 6-7 days/week)',
    extra: 'Extra Active (very hard exercise, physical job)'
  };

  const dietaryGoals = {
    weight_loss: 'Weight Loss',
    muscle_gain: 'Muscle Gain',
    maintain: 'Maintain Weight'
  };

  const handleClose = (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" 
      onClick={handleClose}
    >
      <div 
        className="bg-white rounded-lg shadow-xl w-full max-w-4xl mx-4" 
        onClick={e => e.stopPropagation()}
      >
        {/* Toast */}
        {toast.visible && (
          <div className={`fixed top-4 right-4 px-4 py-2 rounded-md text-white z-60 ${
            toast.type === 'success' ? 'bg-green-500' : 
            toast.type === 'error' ? 'bg-red-500' : 'bg-blue-500'
          }`}>
            {toast.message}
          </div>
        )}

        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-2xl font-bold text-gray-900">User Dashboard</h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Close dashboard"
            type="button"
          >
            <X size={24} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b">
          <button
            onClick={() => setActiveTab('profile')}
            className={`px-6 py-3 font-medium ${
              activeTab === 'profile' 
                ? 'text-green-600 border-b-2 border-green-600 bg-green-50' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Profile & Goals
          </button>
          <button
            onClick={() => setActiveTab('summary')}
            className={`px-6 py-3 font-medium ${
              activeTab === 'summary' 
                ? 'text-green-600 border-b-2 border-green-600 bg-green-50' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Nutrition Summary
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {activeTab === 'profile' && (
            <div className="space-y-6">
              {/* Profile Section */}
              <div className="bg-gray-50 rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Personal Information</h3>
                  {!isEditing ? (
                    <button
                      onClick={() => setIsEditing(true)}
                      className="flex items-center space-x-2 px-3 py-2 text-green-600 border border-green-600 rounded-md hover:bg-green-50 transition-colors"
                    >
                      <Edit3 size={16} />
                      <span>Edit</span>
                    </button>
                  ) : (
                    <div className="flex space-x-2">
                      <button
                        onClick={handleProfileUpdate}
                        disabled={isLoading}
                        className="flex items-center space-x-2 px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors disabled:opacity-50"
                      >
                        <Save size={16} />
                        <span>{isLoading ? 'Saving...' : 'Save'}</span>
                      </button>
                      <button
                        onClick={() => setIsEditing(false)}
                        className="flex items-center space-x-2 px-3 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                      >
                        <X size={16} />
                        <span>Cancel</span>
                      </button>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Age</label>
                    {isEditing ? (
                      <input
                        type="number"
                        value={editProfile.age}
                        onChange={(e) => setEditProfile({...editProfile, age: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500"
                        placeholder="Enter your age"
                      />
                    ) : (
                      <p className="text-gray-900">{userProfile?.age || 'Not set'}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Weight (kg)</label>
                    {isEditing ? (
                      <input
                        type="number"
                        value={editProfile.weight}
                        onChange={(e) => setEditProfile({...editProfile, weight: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500"
                        placeholder="Enter your weight"
                      />
                    ) : (
                      <p className="text-gray-900">{userProfile?.weight ? `${userProfile.weight} kg` : 'Not set'}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Height (cm)</label>
                    {isEditing ? (
                      <input
                        type="number"
                        value={editProfile.height}
                        onChange={(e) => setEditProfile({...editProfile, height: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500"
                        placeholder="Enter your height"
                      />
                    ) : (
                      <p className="text-gray-900">{userProfile?.height ? `${userProfile.height} cm` : 'Not set'}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Activity Level</label>
                    {isEditing ? (
                      <select
                        value={editProfile.activity_level}
                        onChange={(e) => setEditProfile({...editProfile, activity_level: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      >
                        {Object.entries(activityLevels).map(([key, label]) => (
                          <option key={key} value={key}>{label}</option>
                        ))}
                      </select>
                    ) : (
                      <p className="text-gray-900">{activityLevels[userProfile?.activity_level] || 'Not set'}</p>
                    )}
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Dietary Goal</label>
                    {isEditing ? (
                      <select
                        value={editProfile.dietary_goal}
                        onChange={(e) => setEditProfile({...editProfile, dietary_goal: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      >
                        {Object.entries(dietaryGoals).map(([key, label]) => (
                          <option key={key} value={key}>{label}</option>
                        ))}
                      </select>
                    ) : (
                      <p className="text-gray-900">{dietaryGoals[userProfile?.dietary_goal] || 'Not set'}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Daily Goals */}
              {userProfile?.calories_goal && (
                <div className="bg-gray-50 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Daily Nutrition Goals</h3>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-white rounded-lg p-4 text-center">
                      <div className="text-2xl font-bold text-blue-600">{userProfile.calories_goal}</div>
                      <div className="text-sm text-gray-600">Calories</div>
                    </div>
                    <div className="bg-white rounded-lg p-4 text-center">
                      <div className="text-2xl font-bold text-green-600">{userProfile.protein_goal}g</div>
                      <div className="text-sm text-gray-600">Protein</div>
                    </div>
                    <div className="bg-white rounded-lg p-4 text-center">
                      <div className="text-2xl font-bold text-yellow-600">{userProfile.carbs_goal}g</div>
                      <div className="text-sm text-gray-600">Carbs</div>
                    </div>
                    <div className="bg-white rounded-lg p-4 text-center">
                      <div className="text-2xl font-bold text-red-600">{userProfile.fat_goal}g</div>
                      <div className="text-sm text-gray-600">Fat</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'summary' && (
            <div className="space-y-6">
              {nutritionSummary ? (
                <>
                  {/* Today's Progress */}
                  <div className="bg-gray-50 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Today's Progress</h3>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div className="bg-white rounded-lg p-4">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm font-medium text-gray-700">Calories</span>
                          <span className="text-xs text-gray-500">
                            {nutritionSummary.totals?.calories || 0} / {nutritionSummary.goals?.calories || 0}
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                            style={{ 
                              width: `${calculateProgress(nutritionSummary.totals?.calories, nutritionSummary.goals?.calories)}%` 
                            }}
                          ></div>
                        </div>
                      </div>

                      <div className="bg-white rounded-lg p-4">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm font-medium text-gray-700">Protein</span>
                          <span className="text-xs text-gray-500">
                            {nutritionSummary.totals?.protein || 0}g / {nutritionSummary.goals?.protein || 0}g
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-green-600 h-2 rounded-full transition-all duration-300"
                            style={{ 
                              width: `${calculateProgress(nutritionSummary.totals?.protein, nutritionSummary.goals?.protein)}%` 
                            }}
                          ></div>
                        </div>
                      </div>

                      <div className="bg-white rounded-lg p-4">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm font-medium text-gray-700">Carbs</span>
                          <span className="text-xs text-gray-500">
                            {nutritionSummary.totals?.carbs || 0}g / {nutritionSummary.goals?.carbs || 0}g
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-yellow-600 h-2 rounded-full transition-all duration-300"
                            style={{ 
                              width: `${calculateProgress(nutritionSummary.totals?.carbs, nutritionSummary.goals?.carbs)}%` 
                            }}
                          ></div>
                        </div>
                      </div>

                      <div className="bg-white rounded-lg p-4">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm font-medium text-gray-700">Fat</span>
                          <span className="text-xs text-gray-500">
                            {nutritionSummary.totals?.fat || 0}g / {nutritionSummary.goals?.fat || 0}g
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-red-600 h-2 rounded-full transition-all duration-300"
                            style={{ 
                              width: `${calculateProgress(nutritionSummary.totals?.fat, nutritionSummary.goals?.fat)}%` 
                            }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Recent Meals */}
                  {nutritionSummary.recent_meals && nutritionSummary.recent_meals.length > 0 && (
                    <div className="bg-gray-50 rounded-lg p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Meals</h3>
                      <div className="space-y-3">
                        {nutritionSummary.recent_meals.map((meal, index) => (
                          <div key={index} className="bg-white rounded-lg p-4 flex justify-between items-center">
                            <div>
                              <h4 className="font-medium text-gray-900">{meal.food_name}</h4>
                              <p className="text-sm text-gray-600">
                                {new Date(meal.logged_at).toLocaleDateString()} - {meal.serving_size}g
                              </p>
                            </div>
                            <div className="text-right">
                              <div className="font-medium text-gray-900">{Math.round(meal.calories)}cal</div>
                              <div className="text-xs text-gray-600">
                                P: {Math.round(meal.protein)}g | C: {Math.round(meal.carbs)}g | F: {Math.round(meal.fat)}g
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-12">
                  <Calendar size={48} className="mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No nutrition data yet</h3>
                  <p className="text-gray-600">Start logging your meals to see your nutrition summary!</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserDashboard;
