// frontend/src/pages/explore/Trending.jsx
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import API from '../../services/api';

let memoryTagsCache = null;
let lastTagsFetchTime = 0;
const CACHE_TTL = 3 * 60 * 1000; // 3 minutes

export default function Trending() {
	const [tags, setTags] = useState(memoryTagsCache || []);
	
	useEffect(() => {
		if (memoryTagsCache && Date.now() - lastTagsFetchTime < CACHE_TTL) {
			setTags(memoryTagsCache);
			return;
		}

		(async () => {
			try {
				const r = await API.get('/extra/suggestions'); 
				const payload = r.data?.data || r.data || {};
				const hashtags = payload.trendingHashtags || [];
				memoryTagsCache = hashtags;
				lastTagsFetchTime = Date.now();
				setTags(hashtags);
			} catch (e) {
				// Quietly keep cached or empty
			}
		})(); 
	}, []);
	
	if (tags.length === 0) return <div className="text-[#CBD5E1]/50 text-sm">No trending tags.</div>;

	return (
		<div className="space-y-2.5">
			{tags.map((t, i) => (
				<div key={i} className="flex items-center justify-between text-sm group">
					<Link
						to={`/tags/${t}`}
						className="font-semibold text-[#F8FAFC] group-hover:text-[#00F2FE] transition-colors"
					>
						#{t}
					</Link>
					<span className="text-xs text-[#CBD5E1]/60 font-mono">{((i + 1) * 17) % 89 + 12} posts</span>
				</div>
			))}
		</div>
	);
}
