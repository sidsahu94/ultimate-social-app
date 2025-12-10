import React, { useEffect, useState, useCallback } from "react";
import API from "../../services/api";
import { motion } from "framer-motion";
import LazyImage from "../../components/ui/LazyImage";
import { Link, useSearchParams } from "react-router-dom";
import Spinner from "../../components/common/Spinner";
import { useToast } from "../../components/ui/ToastProvider";

export default function Explore() {
	const [searchParams] = useSearchParams();
	// Use local state initialization based on URL, but ensure effect runs for first load
	const [query, setQuery] = useState(searchParams.get('q') || '');
	const [results, setResults] = useState({ posts: [], users: [], hashtags: [] });
	const [trending, setTrending] = useState([]);
	const [loading, setLoading] = useState(false);
	const [activeTab, setActiveTab] = useState(searchParams.get('t') || 'posts');
	const { add: addToast } = useToast();

	// --- 1. Load Trending & Setup Search Executor
	const executeSearch = useCallback(async (q) => {
		const finalQuery = q.trim();
		if (!finalQuery) {
			setResults({ posts: [], users: [], hashtags: [] });
			return;
		}

		setLoading(true);
		try {
			const r = await API.get(`/api/search/global?q=${encodeURIComponent(finalQuery)}`);
			setResults({ 
				users: r.data.users || [], 
				posts: r.data.posts || [],
				hashtags: r.data.hashtags || []
			});
			// Auto switch tab if there are results
			if (r.data.users?.length > 0 && activeTab !== 'users') setActiveTab('users');
			else if (r.data.posts?.length > 0 && activeTab !== 'posts') setActiveTab('posts');
			
		} catch (e2) {
			addToast('Search failed: Network error or bad format', { type: 'error' });
			setResults({ users: [], posts: [], hashtags: [] });
		} finally {
			setLoading(false);
		}
	}, [activeTab, addToast]);
	
	// Execute search on form submit
	const doSearch = (e) => {
		e?.preventDefault?.();
		executeSearch(query);
	};
	
	// Initial Load & URL Parameter Sync
	useEffect(() => {
		// Load Trending
		(async () => {
			try {
				const r = await API.get("/posts/trending");
				setTrending(r.data || []);
			} catch (e) {
				console.warn('Failed to load trending', e);
			}
		})();
		
		// Execute search if query exists in URL on initial load
		const urlQuery = searchParams.get('q');
		const urlTab = searchParams.get('t');
		
		if (urlQuery) {
			setQuery(urlQuery);
			executeSearch(urlQuery);
		}
		if (urlTab) {
			setActiveTab(urlTab);
		}
	}, [searchParams, executeSearch]); // Added dependency array for safety

	// --- 4. Renderers (remain mostly the same, ensuring Links are correct)
	const renderPosts = () => {
		if (loading) return <div className="text-center py-6"><Spinner /></div>;
		if (results.posts.length === 0) return <div className="text-gray-400 text-center py-6">No posts match your search — try another keyword.</div>;
		return (
			<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
				{results.posts.map((p) => (
					<motion.div key={p._id} whileHover={{ scale: 1.01 }} className="card p-3 cursor-pointer">
						<Link to={`/post/${p._id}`}>
							<div className="flex items-start gap-3 mb-2">
								<img src={p.user?.avatar || "/default-avatar.png"} className="w-10 h-10 rounded-full object-cover" />
								<div className="flex-1">
									<div className="font-medium text-indigo-500 hover:text-indigo-600">{p.user?.name}</div>
									<div className="text-xs text-gray-500 dark:text-gray-400">{new Date(p.createdAt).toLocaleDateString()}</div>
								</div>
								<div className="text-sm text-pink-500 flex items-center gap-1">
									<span role="img" aria-label="likes">❤️</span> {(p.likes?.length || 0)}
								</div>
							</div>
							<div className="text-sm mb-3 whitespace-pre-wrap">{p.content}</div>
							{p.images?.[0] && <LazyImage src={p.images[0]} className="h-40 rounded-lg object-cover" />}
							{p.videos?.[0] && <video src={p.videos[0]} className="h-40 w-full object-cover rounded-lg" controls />}
						</Link>
					</motion.div>
				))}
			</div>
		);
	};

	const renderUsers = () => {
		if (loading) return <div className="text-center py-6"><Spinner /></div>;
		if (results.users.length === 0) return <div className="text-gray-400 text-center py-6">No users found.</div>;
		return (
			<div className="grid grid-cols-1 md:grid-cols-2 gap-3">
				{results.users.map(u => (
					<Link key={u._id} to={`/profile/${u._id}`} className="card p-3 flex items-center gap-3 hover:shadow-lg transition">
						<img src={u.avatar || '/default-avatar.png'} className="w-12 h-12 rounded-full object-cover border-2 border-indigo-400/50" />
						<div className="flex-1">
							<div className="font-semibold text-lg">{u.name} {u.badges?.includes('verified') ? '✔️' : ''}</div>
							<div className="text-xs text-gray-500 dark:text-gray-400">@{u.email.split('@')[0]}</div>
						</div>
						<div className="text-sm text-indigo-600 dark:text-indigo-400">{u.followersCount || 0} followers</div>
					</Link>
				))}
			</div>
		);
	};
	
	const renderHashtags = () => {
		if (loading) return <div className="text-center py-6"><Spinner /></div>;
		if (results.hashtags.length === 0) return <div className="text-gray-400 text-center py-6">No matching hashtags found.</div>;
		return (
			<div className="flex flex-wrap gap-2">
				{results.hashtags.map(h => (
					<motion.button 
						key={h} 
						onClick={() => { setQuery(`#${h}`); executeSearch(`#${h}`); }} 
						whileHover={{ scale: 1.05 }}
						className="px-4 py-2 rounded-full bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 font-medium text-sm transition"
					>
						#{h}
					</motion.button>
				))}
			</div>
		);
	};


	// --- 5. Main Render
	return (
		<div className="max-w-6xl mx-auto p-4 grid grid-cols-1 lg:grid-cols-4 gap-6">
			
			<div className="lg:col-span-3 space-y-6">
				
				{/* Search Bar */}
				<motion.div layout className="card p-4">
					<form onSubmit={doSearch} className="flex gap-3">
						<input 
							value={query} 
							onChange={(e) => setQuery(e.target.value)}
							placeholder="Search posts, users, #hashtags..."
							className="flex-1 p-3 rounded-full bg-gray-100 dark:bg-gray-800 outline-none focus:ring-indigo-500 transition" 
						/>
						<button className="btn-primary px-6" disabled={loading}>{loading ? <Spinner /> : 'Search'}</button>
					</form>
				</motion.div>
				
				{/* Tabs */}
				<div className="flex gap-4 border-b pb-1 overflow-x-auto">
					<button onClick={() => setActiveTab('users')} className={`px-4 py-2 text-sm font-medium transition ${activeTab === 'users' ? 'border-b-2 border-indigo-600 text-indigo-600 dark:text-indigo-400' : 'text-gray-500 dark:text-gray-400 hover:text-indigo-500'}`}>
						People ({results.users.length})
					</button>
					<button onClick={() => setActiveTab('posts')} className={`px-4 py-2 text-sm font-medium transition ${activeTab === 'posts' ? 'border-b-2 border-indigo-600 text-indigo-600 dark:text-indigo-400' : 'text-gray-500 dark:text-gray-400 hover:text-indigo-500'}`}>
						Posts ({results.posts.length})
					</button>
					<button onClick={() => setActiveTab('hashtags')} className={`px-4 py-2 text-sm font-medium transition ${activeTab === 'hashtags' ? 'border-b-2 border-indigo-600 text-indigo-600 dark:text-indigo-400' : 'text-gray-500 dark:text-gray-400 hover:text-indigo-500'}`}>
						Hashtags ({results.hashtags.length})
					</button>
				</div>
				
				{/* Tab Content */}
				<motion.div layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} key={activeTab}>
					{activeTab === 'users' && renderUsers()}
					{activeTab === 'posts' && renderPosts()}
					{activeTab === 'hashtags' && renderHashtags()}
				</motion.div>

			</div>
			
			{/* Sidebar / Trending (Simplified render for brevity) */}
			<aside className="lg:col-span-1 space-y-6">
				<div className="card p-4">
					<h4 className="font-semibold text-lg mb-3 border-b pb-2">🔥 Trending Posts</h4>
					<div className="mt-3 space-y-3">
						{trending.length === 0 ? <div className="text-gray-400 text-sm">No trending items yet.</div> :
							trending.slice(0, 6).map(t => (
								<Link key={t._id} to={`/post/${t._id}`} className="flex items-start gap-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 p-2 -m-2 rounded transition">
									<img src={t.user?.avatar || "/default-avatar.png"} className="w-10 h-10 rounded-full object-cover" />
									<div className="flex-1 min-w-0">
										<div className="font-medium text-sm truncate">{t.user?.name}</div>
										<div className="text-xs text-gray-500 dark:text-gray-400 truncate">{(t.content || "").slice(0, 50)}...</div>
									</div>
									<div className="text-sm text-pink-500 flex-shrink-0">{(t.likes?.length || 0)}</div>
								</Link>
							))
						}
					</div>
				</div>
			</aside>
		</div>
	);
}