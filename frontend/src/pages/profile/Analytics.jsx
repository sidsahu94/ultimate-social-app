// frontend/src/pages/profile/Analytics.jsx
import React,{useEffect,useState} from 'react';
import API from '../../services/api';
import { Line } from 'react-chartjs-2';

export default function Analytics(){
  const [data,set]=useState(null);

  useEffect(()=>{ (async()=>set((await API.get('/extra/insights')).data))(); },[]);

  if(!data) return null;

  return (
    <div className="p-4 max-w-3xl mx-auto">
      <h3 className="font-bold mb-3">Profile Growth</h3>
      <Line data={{
        labels:data.dates,
        datasets:[{
          label:'Visits',
          data:data.views,
          borderWidth:3,
        }]
      }}/>
    </div>
  )
}
