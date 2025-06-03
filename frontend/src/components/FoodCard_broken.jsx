import React from 'react';
import { Eye, Calendar, Utensils, Zap, Wheat, Droplet } from 'lucide-react';

const FoodCard = ({ food, onClick, showPreview = true }) => {
  const getCalories = () => {
    const calorieNutrient = food.nutrients?.find(n => 
      n.name?.toLowerCase().includes('energy') || n.name?.toLowerCase().includes('calorie')
    );
    return calorieNutrient ? Math.round(calorieNutrient.amount) : 'N/A';
  };

  const getProtein = () => {
    const proteinNutrient = food.nutrients?.find(n => 
      n.name?.toLowerCase().includes('protein')
    );
    return proteinNutrient ? Math.round(proteinNutrient.amount) : 'N/A';
  };

  const getCarbs = () => {
    const carbNutrient = food.nutrients?.find(n => 
      n.name?.toLowerCase().includes('carbohydrate')
    );
    return carbNutrient ? Math.round(carbNutrient.amount) : 'N/A';
  };

  const getFat = () => {
    const fatNutrient = food.nutrients?.find(n => 
      n.name?.toLowerCase().includes('fat') || n.name?.toLowerCase().includes('lipid')
    );
    return fatNutrient ? Math.round(fatNutrient.amount) : 'N/A';
  };

  const truncateDescription = (text, maxLength = 65) => {
    if (!text || text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  const calories = getCalories();
  const protein = getProtein();
  const carbs = getCarbs();
  const fat = getFat();

  return (
    <div 
      className="group relative bg-white rounded-xl border border-gray-200 p-6 cursor-pointer 
        transition-all duration-300 hover:border-primary-300 hover:shadow-lg hover:-translate-y-1 
        active:scale-[0.98]"
      onClick={() => onClick(food)}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-lg text-gray-900 group-hover:text-primary-700 
            transition-colors leading-tight mb-1">
            {truncateDescription(food.description)}
          </h3>
          {food.brandOwner && (
            <p className="text-sm text-gray-500 font-medium">{food.brandOwner}</p>
          )}
          <div className="flex items-center mt-2 text-xs text-gray-400 space-x-3">
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {food.dataType || 'USDA'}
            </span>
            <span>•</span>
            <span>Per 100g</span>
          </div>
        </div>
        
        {/* Calories Badge */}
        <div className="flex-shrink-0 ml-4">
          <div className="bg-gradient-to-r from-primary-500 to-primary-600 text-white 
            px-3 py-2 rounded-lg text-center min-w-[70px]">
            <div className="text-lg font-bold">{calories}</div>
            <div className="text-xs opacity-90">kcal</div>
          </div>
        </div>
      </div>

      {/* Macros Grid */}
      {showPreview && (calories !== 'N/A' || protein !== 'N/A' || carbs !== 'N/A' || fat !== 'N/A') && (
        <div className="mb-4">
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-blue-50 rounded-lg p-3 text-center">
              <div className="flex items-center justify-center mb-1">
                <Wheat className="h-4 w-4 text-blue-600 mr-1" />
                <span className="text-xs font-medium text-blue-600">Protein</span>
              </div>
              <div className="text-sm font-semibold text-blue-800">{protein}g</div>
            </div>
            
            <div className="bg-yellow-50 rounded-lg p-3 text-center">
              <div className="flex items-center justify-center mb-1">
                <Zap className="h-4 w-4 text-yellow-600 mr-1" />
                <span className="text-xs font-medium text-yellow-600">Carbs</span>
              </div>
              <div className="text-sm font-semibold text-yellow-800">{carbs}g</div>
            </div>
            
            <div className="bg-orange-50 rounded-lg p-3 text-center">
              <div className="flex items-center justify-center mb-1">
                <Droplet className="h-4 w-4 text-orange-600 mr-1" />
                <span className="text-xs font-medium text-orange-600">Fat</span>
              </div>
              <div className="text-sm font-semibold text-orange-800">{fat}g</div>
            </div>
          </div>
        </div>
      )}

      {/* Action Button */}
      <div className="flex items-center justify-between pt-3 border-t border-gray-100">
        <span className="text-sm text-gray-500">
          {food.nutrients?.length || 0} nutrients available
        </span>
        
        <button className="flex items-center gap-2 text-primary-600 hover:text-primary-700 
          font-medium text-sm transition-colors group-hover:translate-x-1 transform duration-200">
          <Eye className="h-4 w-4" />
          View Details
        </button>
      </div>

      {/* Hover Overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-primary-500/5 to-primary-600/5 
        rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
    </div>
  );
};
            <Calendar className="h-3 w-3 mr-1" />
            <span className="capitalize">{food.dataType?.toLowerCase() || 'USDA'}</span>
          </div>
        </div>
        <div className="ml-4 flex-shrink-0">
          <div className="bg-primary-50 p-3 rounded-lg text-center">
            <div className="text-2xl font-bold text-primary-700">{getCalories()}</div>
            <div className="text-xs text-primary-600 font-medium">kcal</div>
          </div>
        </div>
      </div>
      
      {showPreview && (
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="text-center p-3 bg-red-50 rounded-lg">
            <div className="text-lg font-semibold text-red-700">{getProtein()}</div>
            <div className="text-xs text-red-600">Protein (g)</div>
          </div>
          <div className="text-center p-3 bg-blue-50 rounded-lg">
            <div className="text-lg font-semibold text-blue-700">{getCarbs()}</div>
            <div className="text-xs text-blue-600">Carbs (g)</div>
          </div>
          <div className="text-center p-3 bg-yellow-50 rounded-lg">
            <div className="text-lg font-semibold text-yellow-700">{getFat()}</div>
            <div className="text-xs text-yellow-600">Fat (g)</div>
          </div>
        </div>
      )}
      
      <div className="flex items-center justify-between pt-3 border-t border-gray-100">
        <div className="flex items-center text-sm text-gray-500">
          <Utensils className="h-4 w-4 mr-1" />
          <span>Per 100g serving</span>
        </div>
        <button className="flex items-center text-primary-600 hover:text-primary-700 text-sm font-medium transition-colors">
          <Eye className="h-4 w-4 mr-1" />
          View Details
        </button>
      </div>
    </div>
  );
};

export default FoodCard;
