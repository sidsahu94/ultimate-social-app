// frontend/src/pages/profile/ProfilePage.jsx
import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import API from '../../services/api';
import PostGrid from '../../components/profile/PostGrid';
import FollowButton from '../../components/profile/FollowButton';
import ProfileEditModal from '../../components/profile/ProfileEditModal';
import CreatePostModal from '../../components/posts/CreatePostModal';
import { useToast } from '../../components/ui/ToastProvider';
import FollowRequestButton from '../../components/profile/FollowRequestButton';
import ProfileHighlights from '../../components/profile/ProfileHighlights';
import ProfileCompletion from '../../components/profile/ProfileCompletion'; 
import Lightbox from '../../components/ui/Lightbox';
import { FaTwitter, FaInstagram, FaLinkedin, FaLink, FaCheckCircle, FaShare, FaQrcode, FaTimes, FaThumbtack, FaLock } from 'react-icons/fa'; 
import useInfiniteScroll from '../../hooks/useInfiniteScroll';
import MyQR from '../../components/profile/MyQR'; 
import ScanQR from '../../components/profile/ScanQR';
import PostCard from '../../components/posts/PostCard'; 
import { Skeleton } from '../../components/ui/Skeleton';

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
    const [pinnedPost, setPinnedPost] = useState(null); 
    const [loading, setLoading] = useState(true);

    // Private Profile State
    const [isPrivateError, setIsPrivateError] = useState(false);

    // Pagination
    const [postsPage, setPostsPage] = useState(0);
    const [hasMorePosts, setHasMorePosts] = useState(true);
    const [postsLoading, setPostsLoading] = useState(false);

    // UI State
    const [editing, setEditing] = useState(false);
    const [openCreate, setOpenCreate] = useState(false);
    const [viewAvatar, setViewAvatar] = useState(false);
    const [showQR, setShowQR] = useState(false);
    const [showScanner, setShowScanner] = useState(false);
    
    const tab = params.get('tab') || 'posts';
    const isMe = user?.isMe;

    useEffect(() => {
        setLoading(true);
        setPosts([]);
        setPinnedPost(null);
        setIsPrivateError(false);
        setPostsPage(0);
        setHasMorePosts(true);

        const fetchProfile = async () => {
            try {
                // 1. Fetch User Info
                const u = (await API.get(`/users/${id}`)).data;
                setUser(u);

                // 2. Fetch Network
                const [f, fl] = await Promise.all([
                    API.get(`/users/${id}/followers`).then(r => r.data).catch(() => []),
                    API.get(`/users/${id}/following`).then(r => r.data).catch(() => []),
                ]);
                setFollowers(f);
                setFollowing(fl);

                if (u.isMe) {
                    API.get(`/extra/save/${u._id}`).then(r => setSavedPosts(r.data)).catch(() => {});
                }

                // 3. Fetch Pinned
                if (u.pinnedPost) {
                    API.get(`/posts/${u.pinnedPost}`).then(res => setPinnedPost(res.data)).catch(() => {});
                }

                // 4. Fetch Posts (Handle Privacy)
                try {
                    const postsRes = await API.get(`/posts/user/${id}?page=0&limit=12`);
                    setPosts(postsRes.data || []);
                    if (postsRes.data.length < 12) setHasMorePosts(false);
                    setPostsPage(1); 
                } catch (postErr) {
                    // 🔥 FIX: Handle 403 Private Profile
                    if (postErr.response && postErr.response.status === 403) {
                        setIsPrivateError(true);
                        setPosts([]);
                    }
                }

            } catch (e) {
                console.error('Profile load failed', e);
                // addToast(e.userMessage || 'Failed to load profile', { type: 'error' });
            } finally {
                setLoading(false);
            }
        };

        fetchProfile();
    }, [id, addToast]);

    // Live Event Listeners (Optimistic UI)
    useEffect(() => {
        const onPostCreated = (ev) => {
            if (ev.detail && ev.detail.user?._id === id) {
                setPosts(prev => [ev.detail, ...prev]);
            }
        };
        const onPostDeleted = (ev) => {
            const deletedId = ev?.detail;
            if (deletedId) {
                setPosts(prev => prev.filter(p => p._id !== deletedId));
                setSavedPosts(prev => prev.filter(p => p._id !== deletedId));
                if (pinnedPost && pinnedPost._id === deletedId) setPinnedPost(null);
            }
        };
        window.addEventListener('postCreated', onPostCreated);
        window.addEventListener('postDeleted', onPostDeleted);
        return () => {
            window.removeEventListener('postCreated', onPostCreated);
            window.removeEventListener('postDeleted', onPostDeleted);
        };
    }, [id, pinnedPost]);

    // Infinite Scroll
    const loadMorePosts = useCallback(async () => {
        if (postsLoading || !hasMorePosts || isPrivateError) return;
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
    }, [id, postsPage, postsLoading, hasMorePosts, isPrivateError]);

    const postLoaderRef = useInfiniteScroll(loadMorePosts);

    const handleFollowChange = async () => {
        const u = (await API.get(`/users/${id}`)).data;
        setUser(u);
    };

    const copyProfileLink = () => {
        navigator.clipboard.writeText(window.location.href);
        addToast("Profile link copied!", { type: 'success' });
    };

    // User Card Renderer (for Followers/Following)
    const renderUserCard = (f) => (
        <div key={f._id} className="p-3 border dark:border-gray-700 rounded-xl flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-gray-800 transition card bg-white dark:bg-gray-900">
            <div className="flex-shrink-0 cursor-pointer" onClick={() => nav(`/profile/${f._id}`)}>
                <img src={f.avatar || '/default-avatar.png'} className="w-10 h-10 rounded-full object-cover" alt={f.name} />
            </div>
            <div className="font-medium flex-1 truncate hover:text-indigo-500 cursor-pointer" onClick={() => nav(`/profile/${f._id}`)}>
                {f.name}
            </div>
            <FollowRequestButton userId={f._id} onChange={handleFollowChange} />
        </div>
    );

    // 🔥 NEW: Skeleton Loader
    if (loading) {
        return (
            <div className="max-w-5xl mx-auto p-4 animate-pulse">
                <div className="h-48 md:h-64 bg-gray-200 dark:bg-gray-800 rounded-2xl mb-6"></div>
                <div className="px-4">
                    <div className="flex flex-col md:flex-row gap-6 mb-8">
                        <div className="space-y-3 flex-1">
                            <div className="h-8 bg-gray-200 dark:bg-gray-800 rounded w-1/3"></div>
                            <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-1/4"></div>
                            <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-full"></div>
                        </div>
                        <div className="flex gap-3">
                            <div className="h-10 w-24 bg-gray-200 dark:bg-gray-800 rounded-xl"></div>
                            <div className="h-10 w-24 bg-gray-200 dark:bg-gray-800 rounded-xl"></div>
                        </div>
                    </div>
                    <div className="grid grid-cols-3 gap-1">
                        {[...Array(9)].map((_, i) => (
                            <div key={i} className="aspect-square bg-gray-200 dark:bg-gray-800"></div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    if (!user) return <div className="card p-6 text-center text-gray-500 mt-10">Profile not found.</div>;

    return (
        <div className="max-w-5xl mx-auto p-4 pb-20">
            
            {/* Cover & Avatar */}
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
                        <div className="flex items-center gap-2 mb-1">
                            <h2 className="text-3xl font-bold text-gray-900 dark:text-white">{user.name}</h2>
                            {user.isVerified && <FaCheckCircle className="text-blue-500" title="Verified" />}
                        </div>
                        <div className="text-gray-500 dark:text-gray-400 text-sm mb-4">@{user.email?.split('@')[0]}</div>
                        
                        {user.userStatus && (
                            <div className="inline-block bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-300 px-3 py-1 rounded-full text-xs font-bold mb-4 border border-indigo-100 dark:border-indigo-800">
                                {user.userStatus}
                            </div>
                        )}

                        <div className="flex gap-6 mb-5 text-sm text-gray-700 dark:text-gray-300">
                            <button className="hover:text-indigo-500 transition" onClick={() => nav(`/profile/${id}?tab=posts`)}>
                                <span className="font-bold block text-lg">{posts.length}{hasMorePosts && !isPrivateError ? '+' : ''}</span> Posts
                            </button>
                            <button className="hover:text-indigo-500 transition" onClick={() => nav(`/profile/${id}?tab=followers`)}>
                                <span className="font-bold block text-lg">{followers.length}</span> Followers
                            </button>
                            <button className="hover:text-indigo-500 transition" onClick={() => nav(`/profile/${id}?tab=following`)}>
                                <span className="font-bold block text-lg">{following.length}</span> Following
                            </button>
                        </div>
                        
                        <div className="text-sm text-gray-700 dark:text-gray-300 font-medium whitespace-pre-wrap max-w-lg mb-4 leading-relaxed">
                            {user.bio || 'No bio yet.'}
                        </div>

                        {/* Socials */}
                        <div className="flex gap-3 mb-4 flex-wrap">
                            {user.socialLinks?.twitter && <a href={user.socialLinks.twitter} target="_blank" rel="noreferrer" className="p-2 bg-blue-50 dark:bg-blue-900/20 text-blue-500 rounded-lg hover:bg-blue-100 transition"><FaTwitter /></a>}
                            {user.socialLinks?.instagram && <a href={user.socialLinks.instagram} target="_blank" rel="noreferrer" className="p-2 bg-pink-50 dark:bg-pink-900/20 text-pink-500 rounded-lg hover:bg-pink-100 transition"><FaInstagram /></a>}
                            {user.socialLinks?.linkedin && <a href={user.socialLinks.linkedin} target="_blank" rel="noreferrer" className="p-2 bg-blue-50 dark:bg-blue-900/20 text-blue-700 rounded-lg hover:bg-blue-100 transition"><FaLinkedin /></a>}
                            {user.website && <a href={user.website} target="_blank" rel="noreferrer" className="p-2 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 rounded-lg hover:bg-gray-200 transition"><FaLink /></a>}
                        </div>
                    </div>

                    <div className="flex gap-3 w-full md:w-auto">
                        {isMe ? (
                            <button onClick={() => setEditing(true)} className="flex-1 md:flex-none px-6 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 font-semibold hover:bg-gray-50 dark:hover:bg-gray-800 transition">
                                Edit Profile
                            </button>
                        ) : (
                            <>
                                <FollowButton userId={id} onChange={handleFollowChange} />
                                <button onClick={() => nav(`/chat/${user._id}`)} className="flex-1 md:flex-none px-6 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 font-semibold hover:bg-gray-50 dark:hover:bg-gray-800 transition">
                                    Message
                                </button>
                            </>
                        )}
                        <button onClick={copyProfileLink} className="px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition text-gray-600 dark:text-gray-300"><FaShare /></button>
                        <button onClick={() => setShowQR(true)} className="px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition text-gray-600 dark:text-gray-300"><FaQrcode /></button>
                    </div>
                </div>
            </div>

            {isMe && <ProfileCompletion user={user} />}
            <ProfileHighlights isMe={isMe} />

            {pinnedPost && !isPrivateError && (
                <div className="mb-8 mt-4 animate-fade-in">
                    <div className="flex items-center gap-2 text-xs font-bold text-gray-500 uppercase mb-2 px-2">
                        <FaThumbtack className="text-indigo-500 -rotate-45" /> Pinned Post
                    </div>
                    <PostCard post={pinnedPost} />
                </div>
            )}

            {/* Tabs */}
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
                
                {/* 🔥 NEW: Private Profile View */}
                {isPrivateError && tab === 'posts' && !isMe ? (
                    <div className="flex flex-col items-center justify-center py-16 text-center bg-gray-100 dark:bg-gray-800/50 rounded-3xl border border-gray-200 dark:border-gray-700 mx-4">
                        <div className="w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center mb-4">
                            <FaLock className="text-2xl text-gray-500" />
                        </div>
                        <h3 className="text-lg font-bold text-gray-800 dark:text-white">This Account is Private</h3>
                        <p className="text-gray-500 text-sm mt-1">Follow this account to see their posts and stories.</p>
                    </div>
                ) : (
                    // Public / Authorized Content
                    <>
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
                                {hasMorePosts && !postsLoading && <div ref={postLoaderRef} className="h-10" />}
                                {postsLoading && <div className="py-8 text-center flex justify-center"><div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div></div>}
                            </>
                        )}

                        {tab === 'saved' && isMe && (
                            savedPosts.length > 0 ? <PostGrid posts={savedPosts} /> : <div className="py-12 text-center text-gray-400"><p>No saved posts.</p></div>
                        )}

                        {(tab === 'followers' || tab === 'following') && (
                            (tab === 'followers' ? followers : following).length > 0 
                                ? <div className="grid grid-cols-1 md:grid-cols-2 gap-3">{(tab === 'followers' ? followers : following).map(renderUserCard)}</div> 
                                : <div className="py-12 text-center text-gray-400"><p>Nothing to show.</p></div>
                        )}
                    </>
                )}
            </div>

            {/* Modals */}
            <ProfileEditModal isOpen={editing} onClose={() => setEditing(false)} user={user} onUpdate={(u) => { setUser(prev => ({ ...prev, ...u })); setEditing(false); }} />
            <CreatePostModal isOpen={openCreate} onClose={() => setOpenCreate(false)} onPosted={() => window.location.reload()} />
            <Lightbox open={viewAvatar} index={0} images={[user.avatar || '/default-avatar.png']} onClose={() => setViewAvatar(false)} />

            {showQR && (
                <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4" onClick={() => setShowQR(false)}>
                    <div className="bg-white dark:bg-gray-900 rounded-2xl overflow-hidden shadow-2xl animate-fade-in" onClick={e => e.stopPropagation()}>
                        <MyQR />
                        <div className="text-center pb-6 pt-2">
                            <button onClick={() => { setShowQR(false); setShowScanner(true); }} className="text-indigo-600 dark:text-indigo-400 font-bold hover:underline">Scan a Code</button>
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