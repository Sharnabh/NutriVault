import React, { useState, useEffect, useRef } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import { useAuth } from '../contexts/AuthContext';
import { nutritionAPI } from '../services/api';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

const COLORS = {
  calories: 'rgba(37, 99, 235, 0.8)', // blue
  protein: 'rgba(16, 185, 129, 0.8)', // green
  carbs: 'rgba(234, 179, 8, 0.8)',    // yellow
  fat: 'rgba(239, 68, 68, 0.8)'       // red
};

function getDateLabels(range) {
  const labels = [];
  const today = new Date();
  for (let i = range - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    // Format as 'MMM D' (e.g., 'Jun 3')
    const label = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    labels.push(label);
  }
  return labels;
}

const AnalyticsPage = ({ onBack }) => {
  const { user } = useAuth();
  const [range, setRange] = useState(7); // 7 or 30
  const [meals, setMeals] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const chartRef = useRef();

  useEffect(() => {
    const fetchMeals = async () => {
      if (!user) return;
      setIsLoading(true);
      setError('');
      try {
        const token = await user.getIdToken();
        const response = await nutritionAPI.getMeals(token, { days: range });
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
    fetchMeals();
    // eslint-disable-next-line
  }, [user, range]);

  // Aggregate meals by date
  const labels = getDateLabels(range);
  const dataByDate = {};
  labels.forEach(date => {
    dataByDate[date] = { calories: 0, protein: 0, carbs: 0, fat: 0 };
  });
  meals.forEach(meal => {
    // Use only month and day for matching
    const mealLabel = new Date(meal.logged_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    if (dataByDate[mealLabel]) {
      dataByDate[mealLabel].calories += Number(meal.calories) || 0;
      dataByDate[mealLabel].protein += Number(meal.protein) || 0;
      dataByDate[mealLabel].carbs += Number(meal.carbs) || 0;
      dataByDate[mealLabel].fat += Number(meal.fat) || 0;
    }
  });

  // Create gradients for area fills
  const getGradient = (ctx, color) => {
    const gradient = ctx.createLinearGradient(0, 0, 0, 300);
    gradient.addColorStop(0, color.replace('0.8', '0.25'));
    gradient.addColorStop(1, color.replace('0.8', '0'));
    return gradient;
  };

  // Chart data with area gradients
  const chartData = React.useMemo(() => {
    const chart = chartRef.current;
    const ctx = chart?.ctx;
    return {
      labels,
      datasets: [
        {
          label: 'Calories',
          data: labels.map(date => Math.round(dataByDate[date].calories)),
          borderColor: COLORS.calories,
          backgroundColor: ctx ? getGradient(ctx, COLORS.calories) : COLORS.calories,
          tension: 0.4,
          fill: true,
          pointRadius: 6,
          pointBackgroundColor: COLORS.calories,
          pointBorderWidth: 2,
          pointHoverRadius: 8,
        },
        {
          label: 'Protein (g)',
          data: labels.map(date => Math.round(dataByDate[date].protein)),
          borderColor: COLORS.protein,
          backgroundColor: ctx ? getGradient(ctx, COLORS.protein) : COLORS.protein,
          tension: 0.4,
          fill: true,
          pointRadius: 6,
          pointBackgroundColor: COLORS.protein,
          pointBorderWidth: 2,
          pointHoverRadius: 8,
        },
        {
          label: 'Carbs (g)',
          data: labels.map(date => Math.round(dataByDate[date].carbs)),
          borderColor: COLORS.carbs,
          backgroundColor: ctx ? getGradient(ctx, COLORS.carbs) : COLORS.carbs,
          tension: 0.4,
          fill: true,
          pointRadius: 6,
          pointBackgroundColor: COLORS.carbs,
          pointBorderWidth: 2,
          pointHoverRadius: 8,
        },
        {
          label: 'Fat (g)',
          data: labels.map(date => Math.round(dataByDate[date].fat)),
          borderColor: COLORS.fat,
          backgroundColor: ctx ? getGradient(ctx, COLORS.fat) : COLORS.fat,
          tension: 0.4,
          fill: true,
          pointRadius: 6,
          pointBackgroundColor: COLORS.fat,
          pointBorderWidth: 2,
          pointHoverRadius: 8,
        },
      ]
    };
    // eslint-disable-next-line
  }, [labels, dataByDate, chartRef.current]);

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          usePointStyle: true,
          font: { size: 14, weight: 'bold' },
        },
      },
      title: {
        display: true,
        text: `Nutrition Trends (Last ${range} Days)`,
        font: { size: 20, weight: 'bold' },
        color: '#1e293b',
      },
      tooltip: {
        mode: 'index',
        intersect: false,
        backgroundColor: 'rgba(30,41,59,0.95)',
        titleFont: { size: 15, weight: 'bold' },
        bodyFont: { size: 14 },
        callbacks: {
          label: (ctx) => `${ctx.dataset.label}: ${ctx.parsed.y}`,
        },
        borderColor: '#e5e7eb',
        borderWidth: 1,
        padding: 12,
      },
    },
    interaction: {
      mode: 'nearest',
      axis: 'x',
      intersect: false,
    },
    scales: {
      x: {
        title: {
          display: true,
          text: 'Date',
          font: { size: 15, weight: 'bold' },
        },
        ticks: {
          font: { size: 13, weight: 'bold' },
          color: '#334155',
        },
        grid: {
          color: '#f1f5f9',
        },
      },
      y: {
        title: {
          display: true,
          text: 'Amount',
          font: { size: 15, weight: 'bold' },
        },
        beginAtZero: true,
        ticks: {
          font: { size: 13, weight: 'bold' },
          color: '#334155',
        },
        grid: {
          color: '#f1f5f9',
        },
      },
    },
  };

  return (
    <div className="max-w-4xl mx-auto py-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Analytics & Reports</h2>
        <button onClick={onBack} className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300">Back</button>
      </div>
      <div className="bg-white rounded-2xl shadow-xl p-8">
        <div className="flex items-center gap-4 mb-6">
          <button
            className={`px-4 py-2 rounded font-medium transition-colors duration-150 ${range === 7 ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-blue-50'}`}
            onClick={() => setRange(7)}
          >
            Last 7 days
          </button>
          <button
            className={`px-4 py-2 rounded font-medium transition-colors duration-150 ${range === 30 ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-blue-50'}`}
            onClick={() => setRange(30)}
          >
            Last 30 days
          </button>
        </div>
        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading nutrition data...</p>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-center">
            {error}
          </div>
        ) : (
          <div className="w-full max-w-3xl mx-auto">
            <Line ref={chartRef} data={chartData} options={chartOptions} height={350} />
          </div>
        )}
      </div>
    </div>
  );
};

export default AnalyticsPage; 