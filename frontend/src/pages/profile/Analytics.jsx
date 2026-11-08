import React, { useEffect, useState } from 'react';
import API from '../../services/api';
import { Line } from 'react-chartjs-2';

export default function Analytics() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        const res = await API.get('/extra/insights');
        if (mounted) setData(res.data || null);
      } catch (err) {
        console.error('Failed to load analytics:', err);
        if (mounted) setData(null);
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  if (loading) {
    return <div className="mx-auto max-w-3xl p-4 text-gray-500">Loading analytics...</div>;
  }

  if (!data || !Array.isArray(data.dates) || !Array.isArray(data.views)) {
    return <div className="mx-auto max-w-3xl p-4 text-gray-500">No analytics available.</div>;
  }

  return (
    <div className="mx-auto max-w-3xl p-4">
      <h3 className="mb-3 font-bold">Profile Growth</h3>
      <Line
        data={{
          labels: data.dates,
          datasets: [
            {
              label: 'Visits',
              data: data.views,
              borderWidth: 3,
            },
          ],
        }}
      />
    </div>
  );
}