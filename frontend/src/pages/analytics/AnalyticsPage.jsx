// frontend/src/pages/analytics/AnalyticsPage.jsx
import React, { useEffect, useState } from 'react';
import { Line } from 'react-chartjs-2';
import API from '../../services/api';
import { Chart, registerables } from 'chart.js';
import Spinner from '../../components/common/Spinner';

// Register Chart.js components
Chart.register(...registerables);

export default function AnalyticsPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadAnalytics = async () => {
      try {
        const res = await API.get('/apps/analytics');
        // 🔥 FIX: Handle unified response format { success: true, data: {...} }
        // Fallback to res.data if the backend sends legacy format
        setData(res.data.data || res.data);
      } catch (error) {
        console.error("Failed to load analytics:", error);
      } finally {
        setLoading(false);
      }
    };

    loadAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="h-64 flex items-center justify-center">
        <Spinner />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-10 text-center text-gray-500">
        Analytics data is currently unavailable.
      </div>
    );
  }

  // Safe defaults for chart data
  const chartValues = data.chartData || [0, 0, 0, 0, 0, 0, 0];
  
  const chartData = {
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    datasets: [{
      label: 'Engagement',
      data: chartValues,
      borderColor: '#6366f1', // Indigo-500
      backgroundColor: 'rgba(99, 102, 241, 0.2)',
      tension: 0.4,
      fill: true,
      pointBackgroundColor: '#fff',
      pointBorderColor: '#6366f1',
      pointHoverBackgroundColor: '#6366f1',
    }]
  };

  const options = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { 
        legend: { display: false },
        tooltip: {
            backgroundColor: 'rgba(17, 24, 39, 0.9)',
            padding: 12,
            cornerRadius: 8,
            displayColors: false
        }
      },
      scales: {
          y: { 
            beginAtZero: true, 
            grid: { color: 'rgba(200, 200, 200, 0.1)' },
            ticks: { font: { size: 10 } }
          },
          x: { 
            grid: { display: false },
            ticks: { font: { size: 10 } }
          }
      }
  };

  return (
    <div className="max-w-5xl mx-auto p-4 min-h-[80vh]">
      <h2 className="text-2xl font-bold mb-6 flex items-center gap-2 text-gray-800 dark:text-white">
          <span className="text-3xl">📈</span> Creator Studio
      </h2>
      
      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl shadow-sm border-l-4 border-indigo-500">
          <div className="text-gray-500 text-xs font-bold uppercase mb-1">Followers</div>
          <div className="text-2xl font-black text-gray-900 dark:text-white">
            {data.overview?.followers || 0}
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl shadow-sm border-l-4 border-green-500">
          <div className="text-gray-500 text-xs font-bold uppercase mb-1">Total Posts</div>
          <div className="text-2xl font-black text-gray-900 dark:text-white">
            {data.overview?.posts || 0}
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl shadow-sm border-l-4 border-pink-500 col-span-2 md:col-span-1">
          <div className="text-gray-500 text-xs font-bold uppercase mb-1">Total Likes</div>
          <div className="text-2xl font-black text-gray-900 dark:text-white">
            {data.overview?.likes || 0}
          </div>
        </div>
      </div>

      {/* Main Chart */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700">
        <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-lg text-gray-800 dark:text-white">Weekly Growth</h3>
            <div className="text-xs font-medium text-green-500 bg-green-100 dark:bg-green-900/30 px-2 py-1 rounded-full">
                +{(data.overview?.engagement || '0%')} Engagement
            </div>
        </div>
        <div className="h-64 w-full">
          <Line data={chartData} options={options} />
        </div>
      </div>
    </div>
  );
}