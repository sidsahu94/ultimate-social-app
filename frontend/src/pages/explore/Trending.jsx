import React, { useEffect, useState } from 'react';
import API from '../../services/api';

export default function Trending() {
	const [tags, set] = useState([]);
	
	useEffect(()=> {
		(async()=> {
			// FIX: Corrected API path from /extra/suggestions to /api/extra/suggestions which frontend API handles as /extra/suggestions
			const r = await API.get('/extra/suggestions'); 
			set(r.data.trendingHashtags || []);
		})(); 
	}, []);
	
	if (tags.length === 0) return <div className="text-gray-400 text-sm">No trending tags.</div>;

	return (
		<div className="space-y-2">
			{tags.map((t, i) => (
				<div key={i} className="flex items-center justify-between text-sm">
					<span className="font-medium hover:text-indigo-500 cursor-pointer transition">#{t}</span>
					<span className="text-xs text-gray-500">{(Math.random() * 100).toFixed(0)} posts</span>
				</div>
			))}
		</div>
	);
}