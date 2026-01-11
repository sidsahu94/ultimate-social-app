// frontend/src/pages/analytics/AnalyticsPage.jsx
import React, { useEffect, useState } from 'react';
import { Line } from 'react-chartjs-2';
import API from '../../services/api';
import { Chart, registerables } from 'chart.js';
import Spinner from '../../components/common/Spinner';

Chart.register(...registerables);

export default function AnalyticsPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    API.get('/apps/analytics')
       .then(res => setData(res.data))
       .catch(console.error)
       .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="h-64 flex items-center justify-center"><Spinner /></div>;
  if (!data) return <div className="p-10 text-center">Analytics unavailable.</div>;

  const chartData = {
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
    datasets: [{
      label: 'Engagement',
      data: data.chartData || [0,0,0,0,0,0],
      borderColor: '#6366f1',
      backgroundColor: 'rgba(99, 102, 241, 0.2)',
      tension: 0.4,
      fill: true
    }]
  };

  const options = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
          legend: { display: false }
      },
      scales: {
          y: { beginAtZero: true, grid: { color: 'rgba(255,255,255,0.1)' } },
          x: { grid: { display: false } }
      }
  };

  return (
    <div className="max-w-5xl mx-auto p-4 min-h-[80vh]">
      <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
          <span className="text-3xl">📈</span> Creator Studio
      </h2>
      
      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl shadow-sm border-l-4 border-indigo-500">
          <div className="text-gray-500 text-xs font-bold uppercase mb-1">Followers</div>
          <div className="text-2xl font-black">{data.overview?.followers || 0}</div>
        </div>
        <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl shadow-sm border-l-4 border-green-500">
          <div className="text-gray-500 text-xs font-bold uppercase mb-1">Total Posts</div>
          <div className="text-2xl font-black">{data.overview?.posts || 0}</div>
        </div>
        <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl shadow-sm border-l-4 border-pink-500 col-span-2 md:col-span-1">
          <div className="text-gray-500 text-xs font-bold uppercase mb-1">Total Likes</div>
          <div className="text-2xl font-black">{data.overview?.likes || 0}</div>
        </div>
      </div>

      {/* Chart */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-3xl shadow-sm border dark:border-gray-700">
        <h3 className="font-bold mb-4 text-lg">Weekly Growth</h3>
        <div className="h-64 w-full">
          <Line data={chartData} options={options} />
        </div>
      </div>
    </div>
  );
}