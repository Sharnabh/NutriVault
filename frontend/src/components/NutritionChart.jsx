import React from 'react';
import { Doughnut, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
} from 'chart.js';

ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  Title
);

const NutritionChart = ({ nutritionData, chartType = 'pie' }) => {
  const { macronutrients, micronutrients } = nutritionData;

  // Prepare macronutrient data for pie chart
  const getMacroChartData = () => {
    const protein = macronutrients?.protein?.amount || 0;
    const carbs = macronutrients?.carbohydrates?.amount || 0;
    const fat = macronutrients?.fat?.amount || 0;

    const total = protein + carbs + fat;
    
    if (total === 0) {
      return null;
    }

    return {
      labels: ['Protein', 'Carbohydrates', 'Fat'],
      datasets: [
        {
          data: [protein, carbs, fat],
          backgroundColor: [
            '#ef4444', // Red for protein
            '#3b82f6', // Blue for carbs
            '#f59e0b', // Yellow for fat
          ],
          borderColor: [
            '#dc2626',
            '#2563eb',
            '#d97706',
          ],
          borderWidth: 2,
          hoverBackgroundColor: [
            '#fecaca',
            '#bfdbfe',
            '#fde68a',
          ],
        },
      ],
    };
  };

  // Prepare micronutrient data for bar chart
  const getMicroChartData = () => {
    if (!micronutrients || Object.keys(micronutrients).length === 0) {
      return null;
    }

    const nutrients = Object.values(micronutrients).slice(0, 8); // Show top 8 micronutrients
    const labels = nutrients.map(n => n.name.replace(/^[^,]+,\s*/, '').substring(0, 15));
    const data = nutrients.map(n => n.amount || 0);

    return {
      labels,
      datasets: [
        {
          label: 'Amount',
          data,
          backgroundColor: 'rgba(34, 197, 94, 0.6)',
          borderColor: 'rgba(34, 197, 94, 1)',
          borderWidth: 1,
          borderRadius: 4,
        },
      ],
    };
  };

  const macroData = getMacroChartData();
  const microData = getMicroChartData();

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          padding: 20,
          usePointStyle: true,
          font: {
            size: 12,
          },
        },
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            const label = context.label || '';
            const value = context.parsed || context.raw;
            const unit = chartType === 'pie' ? 'g' : 
              (micronutrients && Object.values(micronutrients)[context.dataIndex]?.unit) || '';
            return `${label}: ${value}${unit}`;
          },
        },
      },
    },
  };

  const barOptions = {
    ...chartOptions,
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(0, 0, 0, 0.1)',
        },
      },
      x: {
        grid: {
          display: false,
        },
        ticks: {
          maxRotation: 45,
          minRotation: 0,
        },
      },
    },
  };

  if (chartType === 'pie' && macroData) {
    return (
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 text-center">
          Macronutrient Distribution
        </h3>
        <div className="relative h-64">
          <Doughnut data={macroData} options={chartOptions} />
        </div>
        <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-gray-100">
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">
              {macronutrients?.protein?.amount?.toFixed(1) || '0'}g
            </div>
            <div className="text-sm text-gray-600">Protein</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {macronutrients?.carbohydrates?.amount?.toFixed(1) || '0'}g
            </div>
            <div className="text-sm text-gray-600">Carbs</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-600">
              {macronutrients?.fat?.amount?.toFixed(1) || '0'}g
            </div>
            <div className="text-sm text-gray-600">Fat</div>
          </div>
        </div>
      </div>
    );
  }

  if (chartType === 'bar' && microData) {
    return (
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 text-center">
          Key Micronutrients
        </h3>
        <div className="relative h-64">
          <Bar data={microData} options={barOptions} />
        </div>
        <p className="text-xs text-gray-500 text-center mt-2">
          Values shown per 100g serving
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
      <h3 className="text-lg font-semibold text-gray-900 mb-4 text-center">
        Nutrition Charts
      </h3>
      <div className="text-center text-gray-500 py-8">
        <p>No nutritional data available for charts</p>
      </div>
    </div>
  );
};

export default NutritionChart;
