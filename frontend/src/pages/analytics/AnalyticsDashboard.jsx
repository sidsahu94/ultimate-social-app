// frontend/src/pages/analytics/AnalyticsDashboard.jsx
import React, { useEffect, useState } from "react";
import API from "../../services/api";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

export default function AnalyticsDashboard() {
  const [data, setData] = useState({ dates: [], views: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    try {
      const r = await API.get("/extra/insights");
      setData(r.data || { dates: [], views: [] });
    } catch (e) {
      console.error("insights err", e);
    } finally {
      setLoading(false);
    }
  };

  const chartData = {
    labels: data.dates,
    datasets: [
      {
        label: "Views",
        data: data.views,
        fill: true,
        tension: 0.2,
      },
    ],
  };

  return (
    <div className="max-w-4xl mx-auto p-4">
      <h2 className="text-xl font-semibold mb-4">Analytics Dashboard</h2>
      {loading ? (
        <div>Loading…</div>
      ) : (
        <div className="p-4 border rounded bg-white">
          <Line data={chartData} />
          <div className="mt-4 text-sm text-gray-600">
            This is demo data from <code>/api/extra/insights</code>. Replace with real analytics for production.
          </div>
        </div>
      )}
    </div>
  );
}
