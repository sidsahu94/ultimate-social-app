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
import ProfileHighlights from '../../components/profile/ProfileHighlights';
import Lightbox from '../../components/ui/Lightbox';
import { FaTwitter, FaInstagram, FaLinkedin, FaLink, FaCheckCircle, FaShare, FaQrcode, FaTimes } from 'react-icons/fa'; 
import useInfiniteScroll from '../../hooks/useInfiniteScroll';
import MyQR from '../../components/profile/MyQR'; 
import ScanQR from '../../components/profile/ScanQR';

const ProfilePage = () => {
    const { id } = useParams();
    const nav = useNavigate();
    const [params] = useSearchParams();
    const { add: addToast } = useToast();

    // Data State
    const [user, setUser] = useState(null);
    const [posts, setPosts] = useState([]);
    const [savedPosts, setSavedPosts] = useState([]);
    const [followers, setFollowers] = useState([]);
    const [following, setFollowing] = useState([]);
    const [loading, setLoading] = useState(true);

    // Pagination State for Posts
    const [postsPage, setPostsPage] = useState(0);
    const [hasMorePosts, setHasMorePosts] = useState(true);
    const [postsLoading, setPostsLoading] = useState(false);

    // UI State
    const [editing, setEditing] = useState(false);
    const [openCreate, setOpenCreate] = useState(false);
    
    // Lightbox State
    const [viewAvatar, setViewAvatar] = useState(false);

    // QR State
    const [showQR, setShowQR] = useState(false);
    const [showScanner, setShowScanner] = useState(false);
    
    const tab = params.get('tab') || 'posts';
    const isMe = user?.isMe;

    // 🔥 Initial Load (User Info + First Batch of Data)
    useEffect(() => {
        setLoading(true);
        setPosts([]);
        setPostsPage(0);
        setHasMorePosts(true);

        const fetchProfile = async () => {
            try {
                const u = (await API.get(`/users/${id}`)).data;
                setUser(u);

                // Fetch Followers/Following (Paginate in prod, simplified here)
                const [f, fl] = await Promise.all([
                    API.get(`/users/${id}/followers`).then(r => r.data).catch(() => []),
                    API.get(`/users/${id}/following`).then(r => r.data).catch(() => []),
                ]);
                
                setFollowers(f);
                setFollowing(fl);

                if (u.isMe) {
                    API.get(`/extra/save/${u._id}`).then(r => setSavedPosts(r.data)).catch(() => {});
                }

                // Initial Posts Fetch (Page 0)
                const postsRes = await API.get(`/posts/user/${id}?page=0&limit=12`);
                setPosts(postsRes.data || []);
                if (postsRes.data.length < 12) setHasMorePosts(false);
                setPostsPage(1); 

            } catch (e) {
                console.error('Profile load failed', e);
                addToast(e.userMessage || 'Failed to load profile', { type: 'error' });
            } finally {
                setLoading(false);
            }
        };

        fetchProfile();
    }, [id, addToast]);

    // 🔥 Listen for Global Post Events (Instant UI Updates)
    useEffect(() => {
        const onPostCreated = (ev) => {
            // Only add if it belongs to this profile
            if (ev.detail && ev.detail.user?._id === id) {
                setPosts(prev => [ev.detail, ...prev]);
            }
        };

        const onPostDeleted = (ev) => {
            const deletedId = ev?.detail;
            if (deletedId) {
                setPosts(prev => prev.filter(p => p._id !== deletedId));
                setSavedPosts(prev => prev.filter(p => p._id !== deletedId));
            }
        };

        window.addEventListener('postCreated', onPostCreated);
        window.addEventListener('postDeleted', onPostDeleted);

        return () => {
            window.removeEventListener('postCreated', onPostCreated);
            window.removeEventListener('postDeleted', onPostDeleted);
        };
    }, [id]);

    // Pagination Loader Function
    const loadMorePosts = useCallback(async () => {
        if (postsLoading || !hasMorePosts) return;
        setPostsLoading(true);
        try {
            const res = await API.get(`/posts/user/${id}?page=${postsPage}&limit=12`);
            const newPosts = res.data;
            
            if (newPosts.length < 12) setHasMorePosts(false);
            
            setPosts(prev => [...prev, ...newPosts]);
            setPostsPage(p => p + 1);
        } catch (e) {
            setHasMorePosts(false);
        } finally {
            setPostsLoading(false);
        }
    }, [id, postsPage, postsLoading, hasMorePosts]);

    const postLoaderRef = useInfiniteScroll(loadMorePosts);

    const handleFollowChange = async () => {
        // Simple re-fetch to update status
        const u = (await API.get(`/users/${id}`)).data;
        setUser(u);
    };

    const copyProfileLink = () => {
        const url = window.location.href;
        navigator.clipboard.writeText(url);
        addToast("Profile link copied!", { type: 'success' });
    };

    const renderUserCard = (f) => (
        <div key={f._id} className="p-3 border dark:border-gray-700 rounded-xl flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-gray-800 transition card bg-white dark:bg-gray-900">
            <Link to={`/profile/${f._id}`} className="flex-shrink-0">
                <img src={f.avatar || '/default-avatar.png'} className="w-10 h-10 rounded-full object-cover" alt={f.name} />
            </Link>
            <Link to={`/profile/${f._id}`} className="font-medium flex-1 truncate hover:text-indigo-500">
                {f.name}
            </Link>
            <FollowRequestButton userId={f._id} onChange={handleFollowChange} />
        </div>
    );

    if (loading) return (
        <div className="flex justify-center items-center h-[50vh]">
            <Spinner />
        </div>
    );

    if (!user) return <div className="card p-6 text-center text-gray-500 mt-10">Profile not found.</div>;

    return (
        <div className="max-w-5xl mx-auto p-4 pb-20">
            {/* Cover Photo */}
            <div className="relative profile-hero mb-6 rounded-2xl overflow-hidden shadow-xl bg-gray-200 dark:bg-gray-800 h-48 md:h-64">
                <img src={user.coverPhoto || '/default-cover.jpg'} className="w-full h-full object-cover" alt="cover" />
                <div className="absolute -bottom-16 left-6 md:left-8">
                    <div onClick={() => setViewAvatar(true)} className="cursor-pointer group relative">
                        <img
                            src={user.avatar || '/default-avatar.png'}
                            alt="avatar"
                            className="w-32 h-32 rounded-full object-cover border-4 border-white dark:border-gray-900 shadow-xl bg-white dark:bg-gray-800 group-hover:brightness-90 transition"
                        />
                    </div>
                </div>
            </div>

            {/* Header Info */}
            <div className="pt-16 px-4">
                <div className="flex flex-col md:flex-row items-start justify-between gap-6 mb-4">
                    <div className="flex-1 w-full">
                        {/* Name & Handle */}
                        <div className="flex items-center gap-2 mb-1">
                            <h2 className="text-3xl font-bold text-gray-900 dark:text-white">{user.name}</h2>
                            {user.isVerified && <FaCheckCircle className="text-blue-500" title="Verified" />}
                        </div>
                        <div className="text-gray-500 dark:text-gray-400 text-sm mb-4">@{user.email?.split('@')[0]}</div>
                        
                        {/* Stats */}
                        <div className="flex gap-6 mb-5 text-sm text-gray-700 dark:text-gray-300">
                            <button className="hover:text-indigo-500 transition" onClick={() => nav(`/profile/${id}?tab=posts`)}>
                                <span className="font-bold block text-lg">{posts.length}{hasMorePosts ? '+' : ''}</span> Posts
                            </button>
                            <button className="hover:text-indigo-500 transition" onClick={() => nav(`/profile/${id}?tab=followers`)}>
                                <span className="font-bold block text-lg">{followers.length}</span> Followers
                            </button>
                            <button className="hover:text-indigo-500 transition" onClick={() => nav(`/profile/${id}?tab=following`)}>
                                <span className="font-bold block text-lg">{following.length}</span> Following
                            </button>
                        </div>
                        
                        {/* Bio */}
                        <div className="text-sm text-gray-700 dark:text-gray-300 font-medium whitespace-pre-wrap max-w-lg mb-4 leading-relaxed">
                            {user.bio || 'No bio yet.'}
                        </div>

                        {/* Social Links */}
                        <div className="flex gap-3 mb-4 flex-wrap">
                            {user.socialLinks?.twitter && (
                                <a href={user.socialLinks.twitter} target="_blank" rel="noreferrer" className="p-2 bg-blue-50 dark:bg-blue-900/20 text-blue-500 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/40 transition"><FaTwitter /></a>
                            )}
                            {user.socialLinks?.instagram && (
                                <a href={user.socialLinks.instagram} target="_blank" rel="noreferrer" className="p-2 bg-pink-50 dark:bg-pink-900/20 text-pink-500 rounded-lg hover:bg-pink-100 dark:hover:bg-pink-900/40 transition"><FaInstagram /></a>
                            )}
                            {user.socialLinks?.linkedin && (
                                <a href={user.socialLinks.linkedin} target="_blank" rel="noreferrer" className="p-2 bg-blue-50 dark:bg-blue-900/20 text-blue-700 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/40 transition"><FaLinkedin /></a>
                            )}
                            {user.website && (
                                <a href={user.website} target="_blank" rel="noreferrer" className="p-2 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition"><FaLink /></a>
                            )}
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-3 w-full md:w-auto">
                        {isMe ? (
                            <button onClick={() => setEditing(true)} className="flex-1 md:flex-none px-6 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 font-semibold hover:bg-gray-50 dark:hover:bg-gray-800 transition">
                                Edit Profile
                            </button>
                        ) : (
                            <>
                                <FollowButton 
                                    userId={id} 
                                    onChange={handleFollowChange} 
                                />
                                <button onClick={() => nav(`/chat/${user._id}`)} className="flex-1 md:flex-none px-6 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 font-semibold hover:bg-gray-50 dark:hover:bg-gray-800 transition">
                                    Message
                                </button>
                            </>
                        )}
                        <button 
                            onClick={copyProfileLink} 
                            className="px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition text-gray-600 dark:text-gray-300"
                            title="Share Profile"
                        >
                            <FaShare />
                        </button>
                        <button 
                            onClick={() => setShowQR(true)} 
                            className="px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition text-gray-600 dark:text-gray-300"
                            title="My QR Code"
                        >
                            <FaQrcode />
                        </button>
                    </div>
                </div>
            </div>

            {/* Highlights */}
            <ProfileHighlights isMe={isMe} />

            {/* Tabs Navigation */}
            <div className="mt-6 flex gap-8 border-b border-gray-200 dark:border-gray-700 px-4 overflow-x-auto no-scrollbar">
                {['posts', 'followers', 'following', ...(isMe ? ['saved'] : [])].map(t => (
                    <button 
                        key={t}
                        onClick={() => nav(`/profile/${id}?tab=${t}`)} 
                        className={`py-3 px-2 capitalize font-medium transition border-b-2 whitespace-nowrap ${tab === t ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-800 dark:hover:text-gray-200'}`}
                    >
                        {t}
                    </button>
                ))}
            </div>

            {/* Tab Content */}
            <div className="py-6 min-h-[300px]">
                {tab === 'posts' && (
                    <>
                        {posts.length > 0 ? (
                            <PostGrid posts={posts} />
                        ) : (
                            <div className="py-12 text-center text-gray-400 bg-gray-50 dark:bg-gray-800/30 rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-700">
                                <p className="font-medium">No posts yet</p>
                                {isMe && <button onClick={() => setOpenCreate(true)} className="text-indigo-500 text-sm mt-2 hover:underline font-bold">Create your first post</button>}
                            </div>
                        )}
                        {hasMorePosts && (
                            <div ref={postLoaderRef} className="py-8 text-center flex justify-center">
                                <Spinner />
                            </div>
                        )}
                    </>
                )}

                {tab === 'saved' && isMe && (
                    savedPosts.length > 0 ? <PostGrid posts={savedPosts} /> : (
                        <div className="py-12 text-center text-gray-400">
                            <p>No saved posts yet.</p>
                        </div>
                    )
                )}

                {tab === 'followers' && (
                    followers.length > 0 ? <div className="grid grid-cols-1 md:grid-cols-2 gap-3">{followers.map(renderUserCard)}</div> : (
                        <div className="py-12 text-center text-gray-400"><p>No followers yet.</p></div>
                    )
                )}

                {tab === 'following' && (
                    following.length > 0 ? <div className="grid grid-cols-1 md:grid-cols-2 gap-3">{following.map(renderUserCard)}</div> : (
                        <div className="py-12 text-center text-gray-400"><p>Not following anyone yet.</p></div>
                    )
                )}
            </div>

            {/* Modals */}
            <ProfileEditModal 
                isOpen={editing} 
                onClose={() => setEditing(false)} 
                user={user}
                onUpdate={(updatedUser) => {
                    setUser(prev => ({ ...prev, ...updatedUser }));
                    setEditing(false);
                }}
            />
            
            <CreatePostModal isOpen={openCreate} onClose={() => setOpenCreate(false)} onPosted={() => window.location.reload()} />
            
            <Lightbox 
                open={viewAvatar} 
                index={0} 
                images={[user.avatar || '/default-avatar.png']} 
                onClose={() => setViewAvatar(false)} 
            />

            {/* QR Modals */}
            {showQR && (
                <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4" onClick={() => setShowQR(false)}>
                    <div className="bg-white dark:bg-gray-900 rounded-2xl overflow-hidden shadow-2xl animate-fade-in" onClick={e => e.stopPropagation()}>
                        <MyQR />
                        <div className="text-center pb-6 pt-2">
                            <button onClick={() => { setShowQR(false); setShowScanner(true); }} className="text-indigo-600 dark:text-indigo-400 font-bold hover:underline">
                                Scan a Code
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {showScanner && (
                <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/90 p-4">
                    <div className="w-full max-w-sm bg-white dark:bg-gray-900 rounded-2xl overflow-hidden relative shadow-2xl">
                        <button onClick={() => setShowScanner(false)} className="absolute top-2 right-2 z-10 bg-black/50 text-white p-2 rounded-full hover:bg-red-500 transition"><FaTimes/></button>
                        <ScanQR />
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProfilePage;