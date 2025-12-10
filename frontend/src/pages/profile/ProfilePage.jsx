import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate, useSearchParams, Link } from 'react-router-dom';
import API from '../../services/api';
import PostGrid from '../../components/profile/PostGrid';
import FollowButton from '../../components/profile/FollowButton';
import ProfileEditModal from '../../components/profile/ProfileEditModal';
import CreatePostModal from '../../components/posts/CreatePostModal';
import Spinner from '../../components/common/Spinner';
import { useToast } from '../../components/ui/ToastProvider';
import FollowRequestButton from '../../components/profile/FollowRequestButton';
import ProfileHighlights from '../../components/profile/ProfileHighlights'; // Assuming you added this from previous steps
import { FaTwitter, FaInstagram, FaLinkedin, FaLink, FaCheckCircle } from 'react-icons/fa';

const ProfilePage = () => {
	const { id } = useParams();
	const nav = useNavigate();
	const [params] = useSearchParams();
	const { add: addToast } = useToast();

	const [user, setUser] = useState(null);
	const [posts, setPosts] = useState([]);
	const [editing, setEditing] = useState(false);
	const [openCreate, setOpenCreate] = useState(false);
	const [followers, setFollowers] = useState([]);
	const [following, setFollowing] = useState([]);
	const [loading, setLoading] = useState(true);
	
	const tab = params.get('tab') || 'posts';
	const isMe = user?.isMe;

	const load = useCallback(async () => {
		setLoading(true);
		try {
			const [u, p, f, fl] = await Promise.all([
				API.get(`/users/${id}`).then(r => r.data),
				API.get(`/posts/user/${id}`).then(r => r.data).catch(() => []),
				API.get(`/users/${id}/followers`).then(r => r.data).catch(() => []),
				API.get(`/users/${id}/following`).then(r => r.data).catch(() => []),
			]);
			
			setUser(u);
			setPosts(p);
			setFollowers(f);
			setFollowing(fl); 
			setLoading(false);
		} catch (e) {
			console.error('Profile load failed', e);
			addToast(e.userMessage || 'Failed to load profile', { type: 'error' });
			setLoading(false);
		}
	}, [id, addToast]);

	useEffect(() => {
		load();
	}, [load]);

    // Render logic for user cards in tabs
	const renderUserCard = (f) => (
		<Link to={`/profile/${f._id}`} key={f._id} className="p-3 border rounded-xl flex items-center gap-3 hover:bg-gray-100 dark:hover:bg-gray-700 transition card">
			<img src={f.avatar || '/default-avatar.png'} className="w-10 h-10 rounded-full object-cover" />
			<div className="font-medium flex-1">{f.name}</div>
			<FollowRequestButton userId={f._id} onChange={load} /> 
		</Link>
	);

	if (loading) return <div className="p-6 text-center"><Spinner /></div>;
	if (!user) return <div className="card p-6 text-center text-gray-500">Profile not found.</div>;

	return (
		<div className="max-w-5xl mx-auto p-4">
			{/* Cover */}
			<div className="relative profile-hero mb-6 rounded-xl overflow-hidden shadow-xl bg-gray-200 h-48 md:h-64">
				<img src={user.coverPhoto || '/default-cover.jpg'} className="w-full h-full object-cover" alt="cover" />
				<div className="absolute -bottom-16 left-8">
					<img
						src={user.avatar || '/default-avatar.png'}
						alt="avatar"
						className="w-32 h-32 rounded-full object-cover border-4 border-white dark:border-gray-900 shadow-xl bg-white"
					/>
				</div>
			</div>

			{/* Header Details */}
			<div className="pt-16 px-4">
				<div className="flex flex-col md:flex-row items-start justify-between gap-6 mb-4">
					<div className="flex-1">
						<div className="flex items-center gap-2 mb-1">
							<h2 className="text-3xl font-bold">{user.name}</h2>
                            {user.isVerified && <FaCheckCircle className="text-blue-500" title="Verified" />}
                        </div>
                        <div className="text-gray-500 dark:text-gray-400 text-sm mb-3">@{user.email?.split('@')[0]}</div>
						
                        {/* Stats */}
						<div className="flex gap-6 mb-4 text-sm">
							<div><span className="font-bold">{posts.length}</span> posts</div>
							<div><span className="font-bold">{followers.length}</span> followers</div>
							<div><span className="font-bold">{following.length}</span> following</div>
						</div>
						
						<div className="text-sm text-gray-700 dark:text-gray-300 font-medium whitespace-pre-wrap max-w-lg mb-3">
                            {user.bio || 'No bio yet.'}
                        </div>

                        {/* --- Social Links (New Feature) --- */}
                        <div className="flex gap-3 mb-4">
                            {user.socialLinks?.twitter && (
                                <a href={user.socialLinks.twitter} target="_blank" rel="noreferrer" className="p-2 bg-blue-50 dark:bg-blue-900/30 text-blue-500 rounded-lg hover:bg-blue-100 transition"><FaTwitter /></a>
                            )}
                            {user.socialLinks?.instagram && (
                                <a href={user.socialLinks.instagram} target="_blank" rel="noreferrer" className="p-2 bg-pink-50 dark:bg-pink-900/30 text-pink-500 rounded-lg hover:bg-pink-100 transition"><FaInstagram /></a>
                            )}
                            {user.socialLinks?.linkedin && (
                                <a href={user.socialLinks.linkedin} target="_blank" rel="noreferrer" className="p-2 bg-blue-50 dark:bg-blue-900/30 text-blue-700 rounded-lg hover:bg-blue-100 transition"><FaLinkedin /></a>
                            )}
                            {user.website && (
                                <a href={user.website} target="_blank" rel="noreferrer" className="p-2 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 rounded-lg hover:bg-gray-200 transition"><FaLink /></a>
                            )}
                        </div>
					</div>

					<div className="flex gap-3">
						{isMe ? (
							<button onClick={() => setEditing(true)} className="px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-700 font-semibold hover:bg-gray-50 dark:hover:bg-gray-800 transition">Edit Profile</button>
						) : (
							<>
								<FollowButton userId={id} onChange={load} />
								<button onClick={() => nav('/chat')} className="px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition">Message</button>
							</>
						)}
					</div>
				</div>
			</div>

            {/* Highlights */}
            <ProfileHighlights isMe={isMe} />

			{/* Tabs */}
			<div className="mt-4 flex gap-8 border-b border-gray-200 dark:border-gray-700 px-4">
				{['posts', 'followers', 'following'].map(t => (
                    <button 
                        key={t}
                        onClick={() => nav(`/profile/${id}?tab=${t}`)} 
                        className={`py-3 px-1 capitalize font-medium transition border-b-2 ${tab === t ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-800 dark:hover:text-gray-200'}`}
                    >
                        {t}
                    </button>
                ))}
			</div>

			<div className="py-6">
				{tab === 'posts' && <PostGrid posts={posts} />}
				{tab === 'followers' && <div className="grid grid-cols-1 md:grid-cols-2 gap-3">{followers.map(renderUserCard)}</div>}
				{tab === 'following' && <div className="grid grid-cols-1 md:grid-cols-2 gap-3">{following.map(renderUserCard)}</div>}
			</div>

			<ProfileEditModal isOpen={editing} onClose={() => { setEditing(false); load(); }} user={user} />
			<CreatePostModal isOpen={openCreate} onClose={() => setOpenCreate(false)} onPosted={load} />
		</div>
	);
};

export default ProfilePage;