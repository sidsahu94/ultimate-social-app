// frontend/src/pages/profile/FollowersList.jsx
import React, { useEffect, useState } from 'react';
import API from '../../services/api';
import { useParams } from 'react-router-dom';

export default function FollowersList() {
  const { id } = useParams();
  const [list, setList] = useState([]);

  useEffect(() => {
    (async () => {
      try {
        const r = await API.get(`/users/${id}`);
        setList(r.data.followers || []);
      } catch (e) { console.error(e); }
    })();
  }, [id]);

  return (
    <div className="max-w-4xl mx-auto p-4">
      <h3 className="text-lg font-semibold mb-3">Followers</h3>
      {list.length === 0 ? <div>No followers</div> : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {list.map(f => <div key={f._id} className="p-2 border rounded flex items-center gap-3"><img src={f.avatar||'/default-avatar.png'} className="w-10 h-10 rounded-full" /><div>{f.name}</div></div>)}
        </div>
      )}
    </div>
  );
}
