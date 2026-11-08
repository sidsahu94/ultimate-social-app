// frontend/src/pages/nearby/Nearby.jsx
import React, { useEffect, useState } from 'react';
import API from '../../services/api';
import { Link } from 'react-router-dom';
import { FaCompass, FaMapMarkerAlt } from 'react-icons/fa';
import UserAvatar from '../../components/ui/UserAvatar';

export default function Nearby() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          try {
            const { latitude: lat, longitude: lng } = pos.coords;
            await API.post('/social/geo', { lat, lng });
            const r = await API.get(`/social/nearby?lat=${lat}&lng=${lng}&km=50`);
            const payload = r.data?.data || r.data;
            setItems(Array.isArray(payload) ? payload : []);
          } catch (e) {
            console.error('Nearby error:', e);
          } finally {
            setLoading(false);
          }
        },
        () => {
          setLoading(false);
        }
      );
    } else {
      setLoading(false);
    }
  }, []);

  return (
    <div className="max-w-3xl mx-auto p-4 md:p-6 pb-24">
      <div className="mb-6 pb-4 border-b border-white/10">
        <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-[#00F2FE] mb-1">
          <FaCompass /> Spatial Radar
        </div>
        <h1 className="text-2xl md:text-3xl font-black text-[#F7F7FC] tracking-tight font-display">
          Creators Nearby<span className="text-[#00F2FE]">.</span>
        </h1>
        <p className="text-xs text-[#CBD5E1] mt-1">Discover community members broadcasting in your geographical vicinity.</p>
      </div>

      {loading ? (
        <div className="p-12 text-center text-xs text-[#A5A9BB]">Scanning local perimeter...</div>
      ) : items.length === 0 ? (
        <div className="p-16 text-center text-[#CBD5E1] bg-[#070B14]/40 border border-white/10 rounded-3xl backdrop-blur-xl">
          <FaMapMarkerAlt className="mx-auto text-4xl mb-3 text-[#A5A9BB] opacity-30" />
          <p className="font-semibold text-sm">No nearby creators found.</p>
          <p className="text-xs text-[#A5A9BB] mt-1">Ensure location permissions are granted to detect nearby profiles.</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {items.map((u) => (
            <Link 
              key={u._id} 
              to={`/profile/${u._id}`} 
              className="bg-[#070B14]/90 border border-white/10 rounded-2xl p-4 flex items-center gap-3.5 hover:border-white/20 hover:shadow-[0_8px_25px_rgba(29,78,216,0.15)] transition-all backdrop-blur-xl group"
            >
              <UserAvatar src={u.avatar} name={u.name} className="w-12 h-12 border border-white/10" />
              <div className="min-w-0 flex-1">
                <div className="font-bold text-[#F7F7FC] text-sm group-hover:text-[#00F2FE] transition-colors truncate">{u.name}</div>
                <div className="text-xs text-[#CBD5E1] truncate">@{u.username || 'creator'}</div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
