import React from 'react';
import { BarChart3, TrendingUp, Database, Clock } from 'lucide-react';

const StatsCard = ({ icon: Icon, title, value, description, color = 'primary' }) => {
  const colorClasses = {
    primary: 'from-primary-500 to-primary-600',
    green: 'from-green-500 to-green-600',
    blue: 'from-blue-500 to-blue-600',
    purple: 'from-purple-500 to-purple-600'
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className={`inline-flex items-center justify-center w-12 h-12 rounded-lg bg-gradient-to-r ${colorClasses[color]} mb-4`}>
            <Icon className="h-6 w-6 text-white" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-1">{title}</h3>
          <p className="text-3xl font-bold text-gray-900 mb-2">{value}</p>
          <p className="text-sm text-gray-600">{description}</p>
        </div>
      </div>
    </div>
  );
};

const DatabaseStats = ({ searchHistory }) => {
  const totalSearches = searchHistory.length;
  const uniqueFoods = new Set(searchHistory.map(item => item.fdc_id)).size;
  const recentSearches = searchHistory.filter(item => {
    const searchDate = new Date(item.searched_at);
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    return searchDate > oneDayAgo;
  }).length;

  return (
    <div className="mb-8">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Your Nutrition Journey</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          icon={Database}
          title="Total Searches"
          value={totalSearches}
          description="Food items explored"
          color="primary"
        />
        <StatsCard
          icon={BarChart3}
          title="Unique Foods"
          value={uniqueFoods}
          description="Different food types"
          color="green"
        />
        <StatsCard
          icon={Clock}
          title="Recent Activity"
          value={recentSearches}
          description="Searches in last 24h"
          color="blue"
        />
        <StatsCard
          icon={TrendingUp}
          title="Database Access"
          value="500K+"
          description="USDA food entries available"
          color="purple"
        />
      </div>
    </div>
  );
};

export default DatabaseStats;
