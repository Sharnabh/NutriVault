import React, { useState, useEffect } from 'react';
import { Utensils, Heart, TrendingUp, AlertCircle, CheckCircle, Users, LogIn, User } from 'lucide-react';
import SearchBar from './components/SearchBar';
import FoodCard from './components/FoodCard';
import FoodDetailsModal from './components/FoodDetailsModal';
import HistoryTable from './components/HistoryTable';
import DatabaseStats from './components/DatabaseStats';
import QuickSearch from './components/QuickSearch';
import LoadingSpinner from './components/LoadingSpinner';
import Toast from './components/Toast';
import AuthModal from './components/AuthModal';
import UserDashboard from './components/UserDashboard';
import MealLogModal from './components/MealLogModal';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { nutritionAPI } from './services/api';

function MainApp() {
  const { user, loading } = useAuth();
  const [searchResults, setSearchResults] = useState([]);
  const [selectedFood, setSelectedFood] = useState(null);
  const [nutritionData, setNutritionData] = useState(null);
  const [searchHistory, setSearchHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [error, setError] = useState(null);
  const [backendStatus, setBackendStatus] = useState('checking');
  const [toast, setToast] = useState({ message: '', type: 'info', isVisible: false });
  
  // New authentication state
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isDashboardOpen, setIsDashboardOpen] = useState(false);
  const [isMealLogModalOpen, setIsMealLogModalOpen] = useState(false);

  // Check backend health on mount
  useEffect(() => {
    checkBackendHealth();
    loadSearchHistory();
  }, []);

  const checkBackendHealth = async () => {
    try {
      await nutritionAPI.healthCheck();
      setBackendStatus('connected');
    } catch (error) {
      setBackendStatus('disconnected');
      console.error('Backend health check failed:', error);
    }
  };

  const showToast = (message, type = 'info') => {
    setToast({ message, type, isVisible: true });
  };

  const hideToast = () => {
    setToast(prev => ({ ...prev, isVisible: false }));
  };

  const loadSearchHistory = async () => {
    try {
      const response = await nutritionAPI.getHistory();
      if (response.success) {
        setSearchHistory(response.history);
      }
    } catch (error) {
      console.error('Failed to load search history:', error);
    }
  };  const handleSearch = async (query, signal) => {
    if (!query.trim()) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await nutritionAPI.searchFoods(query);
      
      if (response.success) {
        setSearchResults(response.foods || []);
        
        if (response.foods && response.foods.length === 0) {
          showToast('No foods found for your search query', 'warning');
        } else if (response.foods && response.foods.length > 0) {
          showToast(`Found ${response.foods.length} food items`, 'success');
        }
      } else {
        setError('Failed to search foods. Please try again.');
        showToast('Search failed. Please try again.', 'error');
      }
    } catch (error) {
      // Check if it's an abort error
      if (error.name === 'AbortError' || signal?.aborted) {
        return;
      }
      
      setError(error.message || 'An error occurred while searching');
      showToast('Search error. Please check your connection.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearSearch = () => {
    setSearchResults([]);
    setError(null);
  };

  const handleFoodClick = async (food) => {
    setSelectedFood(food);
    setIsModalOpen(true);
    setNutritionData(null);

    try {
      const response = await nutritionAPI.getFoodDetails(food.fdcId);
      if (response.success) {
        setNutritionData(response.food);
        showToast(`Loaded nutrition data for ${food.description}`, 'success');
        
        // Add to history
        await nutritionAPI.addToHistory({
          fdcId: food.fdcId,
          foodName: food.description,
          nutritionData: response.food
        });
        
        // Refresh history
        loadSearchHistory();
      } else {
        setError('Failed to load food details');
        showToast('Failed to load food details', 'error');
      }
    } catch (error) {
      setError(error.message || 'Failed to load food details');
      showToast('Error loading food details', 'error');
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedFood(null);
    setNutritionData(null);
  };

  const handleClearHistory = async () => {
    setSearchHistory([]);
  };

  // New authentication handlers
  const handleOpenMealLog = () => {
    if (!user) {
      setIsAuthModalOpen(true);
      showToast('Please sign in to log meals', 'info');
      return;
    }
    setIsMealLogModalOpen(true);
  };

  const handleCloseMealLog = () => {
    setIsMealLogModalOpen(false);
  };

  const handleOpenDashboard = () => {
    setIsDashboardOpen(true);
  };

  const handleCloseDashboard = () => {
    setIsDashboardOpen(false);
  };

  const renderStatusBanner = () => {
    if (backendStatus === 'checking') return null;
    
    if (backendStatus === 'disconnected') {
      return (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <div className="flex items-center">
            <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
            <div>
              <p className="text-red-800 font-medium">Backend Service Unavailable</p>
              <p className="text-red-600 text-sm">
                Please ensure the Flask backend is running on port 5003. 
                <button 
                  onClick={checkBackendHealth} 
                  className="underline ml-1 hover:text-red-800 transition-colors"
                >
                  Retry connection
                </button>
              </p>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-6">
        <div className="flex items-center">
          <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
          <p className="text-green-800 text-sm">Connected to Nutrivault API</p>
        </div>
      </div>
    );
  };

  const renderHeroSection = () => (
    <div className="text-center mb-12">
      <div className="inline-flex items-center justify-center w-20 h-20 bg-primary-100 rounded-full mb-6">
        <Utensils className="h-10 w-10 text-primary-600" />
      </div>
      
      <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
        Nutri<span className="text-primary-600">vault</span>
      </h1>
      
      <p className="text-xl text-gray-600 mb-2 max-w-2xl mx-auto">
        Discover comprehensive nutritional information for any food item
      </p>
      
      <p className="text-gray-500 mb-8 max-w-xl mx-auto">
        Powered by USDA's comprehensive food database with detailed macro and micronutrient analysis
      </p>

      <div className="flex flex-wrap justify-center gap-6 text-sm text-gray-600 mb-8">
        <div className="flex items-center">
          <Heart className="h-4 w-4 text-red-500 mr-2" />
          <span>Accurate Nutrition Data</span>
        </div>
        <div className="flex items-center">
          <TrendingUp className="h-4 w-4 text-green-500 mr-2" />
          <span>Visual Charts & Analysis</span>
        </div>
        <div className="flex items-center">
          <Users className="h-4 w-4 text-blue-500 mr-2" />
          <span>Search History Tracking</span>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Utensils className="h-8 w-8 text-primary-600 mr-3" />
              <h1 className="text-2xl font-bold text-gray-900">
                Nutri<span className="text-primary-600">vault</span>
              </h1>
            </div>
            
            {/* Authentication Section */}
            <div className="flex items-center space-x-4">
              {user ? (
                <div className="flex items-center space-x-3">
                  <span className="text-sm text-gray-600">
                    Welcome, {user.displayName || user.email}
                  </span>
                  <button
                    onClick={handleOpenDashboard}
                    className="flex items-center space-x-2 px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                  >
                    <User size={16} />
                    <span>Dashboard</span>
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setIsAuthModalOpen(true)}
                  className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                >
                  <LogIn size={16} />
                  <span>Sign In</span>
                </button>
              )}
              <div className="text-sm text-gray-500">
                Powered by USDA FoodData Central
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {renderStatusBanner()}
        
        {searchResults.length === 0 && searchHistory.length === 0 && (
          <>
            {renderHeroSection()}
            <QuickSearch onSearch={handleSearch} className="mb-12" />
          </>
        )}

        {/* Search Bar */}
        <div className="mb-8">
          <SearchBar 
            onSearch={handleSearch}
            onClear={handleClearSearch}
            isLoading={isLoading}
          />
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-center">
              <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
              <p className="text-red-800">{error}</p>
            </div>
          </div>
        )}

        {/* Search Results */}
        {searchResults.length > 0 && (
          <div className="mb-12">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">
                Search Results ({searchResults.length})
              </h2>
              {isLoading && (
                <div className="flex items-center text-primary-600">
                  <LoadingSpinner size="sm" className="mr-2" />
                  <span className="text-sm">Loading...</span>
                </div>
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {searchResults.map((food) => (
                <FoodCard
                  key={food.fdcId}
                  food={food}
                  onClick={handleFoodClick}
                />
              ))}
            </div>
          </div>
        )}

        {/* Search History and Stats */}
        {searchHistory.length > 0 && (
          <>
            <DatabaseStats searchHistory={searchHistory} />
            <div className="mb-8">
              <HistoryTable
                history={searchHistory}
                onViewDetails={handleFoodClick}
                onClearHistory={handleClearHistory}
              />
            </div>
          </>
        )}

        {/* Empty State */}
        {searchResults.length === 0 && searchHistory.length === 0 && !isLoading && (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <Utensils className="h-16 w-16 mx-auto" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Start Your Nutrition Journey
            </h3>
            <p className="text-gray-500 max-w-md mx-auto">
              Search for any food item above to discover its nutritional profile, 
              including detailed macro and micronutrient information.
            </p>
          </div>
        )}
      </main>

      {/* Food Details Modal */}
      <FoodDetailsModal
        food={selectedFood}
        nutritionData={nutritionData}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onLogMeal={handleOpenMealLog}
        user={user}
      />

      {/* Authentication Modal */}
      {isAuthModalOpen && (
        <AuthModal
          isOpen={isAuthModalOpen}
          onClose={() => setIsAuthModalOpen(false)}
          initialMode="login"
        />
      )}

      {/* User Dashboard */}
      {isDashboardOpen && (
        <UserDashboard
          isOpen={isDashboardOpen}
          onClose={handleCloseDashboard}
        />
      )}

      {/* Meal Log Modal */}
      {isMealLogModalOpen && selectedFood && nutritionData && (
        <MealLogModal
          isOpen={isMealLogModalOpen}
          onClose={handleCloseMealLog}
          food={selectedFood}
          nutritionData={nutritionData}
        />
      )}

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <div className="flex items-center justify-center mb-4">
              <Utensils className="h-6 w-6 text-primary-600 mr-2" />
              <span className="text-lg font-semibold text-gray-900">Nutrivault</span>
            </div>
            <p className="text-gray-600 text-sm mb-4">
              Your comprehensive nutrition companion powered by USDA's food database
            </p>
            <p className="text-xs text-gray-500">
              Data provided by USDA FoodData Central API • Built with React & Flask
            </p>
          </div>
        </div>
      </footer>

      {/* Toast Notifications */}
      {toast.isVisible && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={hideToast}
        />
      )}
    </div>
  );
}

// Main App component wrapped with AuthProvider
function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}

export default App;
