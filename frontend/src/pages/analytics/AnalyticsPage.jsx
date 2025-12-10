import React, { useEffect, useState } from 'react';
import { Line } from 'react-chartjs-2';
import API from '../../services/api';
import { Chart, registerables } from 'chart.js';
Chart.register(...registerables);

export default function AnalyticsPage() {
  const [data, setData] = useState(null);

  useEffect(() => {
    API.get('/apps/analytics').then(res => setData(res.data)).catch(console.error);
  }, []);

  if (!data) return <div className="p-10 text-center">Loading Analytics...</div>;

  const chartData = {
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
    datasets: [{
      label: 'Profile Visits',
      data: data.chartData,
      borderColor: '#6366f1',
      backgroundColor: 'rgba(99, 102, 241, 0.2)',
      tension: 0.4,
      fill: true
    }]
  };

  return (
    <div className="max-w-5xl mx-auto p-4">
      <h2 className="text-2xl font-bold mb-6">Creator Studio</h2>
      
      {/* Stat Cards */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border-l-4 border-indigo-500">
          <div className="text-gray-500 text-sm">Total Followers</div>
          <div className="text-3xl font-bold">{data.overview.followers}</div>
        </div>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border-l-4 border-green-500">
          <div className="text-gray-500 text-sm">Profile Views</div>
          <div className="text-3xl font-bold">{data.overview.views}</div>
        </div>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border-l-4 border-pink-500">
          <div className="text-gray-500 text-sm">Engagement Rate</div>
          <div className="text-3xl font-bold">{data.overview.engagement}</div>
        </div>
      </div>

      {/* Chart */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-3xl shadow-sm">
        <h3 className="font-bold mb-4">Growth Trends</h3>
        <div className="h-64">
          <Line data={chartData} options={{ responsive: true, maintainAspectRatio: false }} />
        </div>
      </div>
    </div>
  );
}