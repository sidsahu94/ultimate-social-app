import React, { useEffect, useState } from 'react';
import API from '../../services/api';
import PostCard from '../../components/posts/PostCard';
import { useToast } from '../../components/ui/ToastProvider';
import { useSelector } from 'react-redux';
import Spinner from '../../components/common/Spinner';

export default function SavedPage() {
	const [posts, setPosts] = useState([]);
	const [loading, setLoading] = useState(true);
	const { add: addToast } = useToast();
	const myId = useSelector(s => s.auth?.user?._id || localStorage.getItem('meId'));

	useEffect(() => {
		const load = async () => {
			setLoading(true);
			try {
				if (!myId) { 
					addToast('Please login to view saved posts', { type: 'error' }); 
					return; 
				}
                // --- FIX: Updated route to match backend (requires ID) ---
				const r = await API.get(`/extra/save/${myId}`); 
				setPosts(r.data || []);
			} catch (err) {
				console.error('load saved', err);
				addToast('Failed to load saved posts', { type: 'error' });
			} finally {
				setLoading(false);
			}
		};
		if(myId) load();
	}, [myId, addToast]);

	if (!myId) return <div className="p-4 text-center">Please login.</div>;
	if (loading) return <div className="p-4 text-center"><Spinner /></div>;

	return (
		<div className="max-w-4xl mx-auto p-4">
			<h2 className="text-xl font-semibold mb-4 border-b pb-2">💾 Saved Posts</h2>
			{posts.length === 0 ? <div className="card p-6 text-gray-500 text-center">No saved posts yet.</div> :
				posts.map(p => <PostCard key={p._id} post={p} />)
			}
		</div>
	);
}