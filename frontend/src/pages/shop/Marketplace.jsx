// frontend/src/pages/shop/Marketplace.jsx
import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../../services/api';
import ProductCard from '../../components/shop/ProductCard';
import { FaSearch, FaPlus, FaStore, FaUpload } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '../../components/ui/ToastProvider';
import { useSelector, useDispatch } from 'react-redux';
import { updateAuthUser } from '../../redux/slices/authSlice';
import { playSound } from '../../utils/soundEffects';

const CATEGORIES = ['All', 'Digital', 'Services', 'Merch', 'NFTs', 'Mine'];
const CREATE_CATEGORIES = ['Digital', 'Services', 'Merch', 'NFTs'];

const emptyItem = {
  title: '',
  price: '',
  stock: '1',
  description: '',
  category: 'Digital',
};

export default function Marketplace() {
  const [items, setItems] = useState([]);
  const [filter, setFilter] = useState('All');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newItem, setNewItem] = useState(emptyItem);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');

  const { add } = useToast();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((s) => s.auth);
  const myId = user?._id;

  useEffect(() => {
    if (!imageFile) {
      setImagePreview('');
      return undefined;
    }
    const previewUrl = URL.createObjectURL(imageFile);
    setImagePreview(previewUrl);
    return () => URL.revokeObjectURL(previewUrl);
  }, [imageFile]);

  useEffect(() => {
    loadItems(filter === 'Mine' ? 'mine' : 'all');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  const loadItems = async (scope = 'all') => {
    setLoading(true);
    try {
      const endpoint = scope === 'mine' ? '/shop/mine' : '/shop';
      const res = await API.get(endpoint);
      setItems(res.data.data || res.data || []);
    } catch (e) {
      console.error(e);
      add('Failed to load marketplace', { type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    try {
      if (!user) {
        add('Please log in to create a listing', { type: 'error' });
        navigate('/login');
        return;
      }

      if (!newItem.title.trim() || !String(newItem.price).trim()) {
        add('Title and price are required', { type: 'error' });
        return;
      }

      const formData = new FormData();
      formData.append('title', newItem.title.trim());
      formData.append('description', newItem.description.trim());
      formData.append('price', String(Number(newItem.price)));
      formData.append('stock', String(Math.max(1, Number(newItem.stock || 1))));
      formData.append('category', newItem.category);
      if (imageFile) formData.append('image', imageFile);

      await API.post('/shop', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      playSound('cyber');
      add('Listing created!', { type: 'success' });
      setShowCreate(false);
      setNewItem(emptyItem);
      setImageFile(null);
      loadItems(filter === 'Mine' ? 'mine' : 'all');
    } catch (e) {
      add(e.response?.data?.message || 'Failed to create listing', { type: 'error' });
    }
  };

  const handleDeleteItem = async (itemId) => {
    if (!window.confirm('Remove this listing?')) return;

    try {
      await API.delete(`/shop/${itemId}`);
      setItems((prev) => prev.filter((i) => i._id !== itemId));
      add('Listing removed', { type: 'info' });
    } catch (e) {
      add(e.response?.data?.message || 'Failed to delete', { type: 'error' });
    }
  };

  const handleBuy = async (item) => {
    if (!user) {
      add('Please login to buy items', { type: 'error' });
      navigate('/login');
      return;
    }

    const currentBalance = user.wallet?.balance || 0;
    if (currentBalance < Number(item.price || 0)) {
      add(`Insufficient Treasury coins (Balance: ${currentBalance}, Price: ${item.price}). Claim daily bonus in Wallet!`, { type: 'error' });
      return;
    }

    if (!window.confirm(`Confirm purchase of "${item.title}" for ${item.price} coins?`)) return;

    try {
      const res = await API.post(`/shop/${item._id}/buy`);
      playSound('success');
      add(`Successfully purchased ${item.title}!`, { type: 'success' });

      setItems((prev) =>
        prev.map((i) =>
          i._id === item._id ? { ...i, stock: Math.max(0, (i.stock || 1) - 1) } : i
        )
      );

      const currentBalance = user.wallet?.balance || 0;
      const nextBalance =
        res.data?.data?.balance ?? currentBalance - Number(item.price || 0);

      dispatch(
        updateAuthUser({
          wallet: { ...(user.wallet || {}), balance: nextBalance },
        })
      );
    } catch (e) {
      add(e.response?.data?.message || 'Purchase failed', { type: 'error' });
    }
  };

  const visibleItems = useMemo(() => {
    const q = search.trim().toLowerCase();
    const base =
      filter === 'Mine'
        ? items.filter((i) => String(i.owner?._id || i.createdBy) === String(myId))
        : filter === 'All'
          ? items
          : items.filter((i) => i.category === filter);

    if (!q) return base;

    return base.filter((item) => {
      const haystack = [
        item.title,
        item.description,
        item.desc,
        item.category,
        item.price,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      return haystack.includes(q);
    });
  }, [items, filter, search, myId]);

  return (
    <div className="mx-auto min-h-screen max-w-7xl px-4 py-5 md:px-6">
      {/* Header Hero */}
      <div className="mb-7 overflow-hidden rounded-[32px] border border-white/10 bg-[#070B14]/90 p-6 md:p-8 shadow-2xl backdrop-blur-xl">
        <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-white/10 bg-[#171A26]/80 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.2em] text-[#00F2FE] backdrop-blur">
              <FaStore /> Marketplace
            </div>
            <h1 className="text-3xl md:text-5xl font-black tracking-tight text-[#F7F7FC] font-display">
              Curated Luxury Commerce<span className="text-[#00F2FE]">.</span>
            </h1>
            <p className="mt-2.5 max-w-2xl text-sm leading-relaxed text-[#CBD5E1]">
              Discover digital assets, creator merchandise, services, and collector NFTs in one editorial showcase.
            </p>
          </div>

          <div className="flex w-full flex-col gap-3 md:w-auto md:flex-row">
            <div className="relative w-full md:w-80">
              <FaSearch className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#A5A9BB]" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search catalog..."
                className="w-full rounded-2xl border border-white/10 bg-[#0A111E] py-3 pl-11 pr-4 text-xs text-[#F7F7FC] placeholder-[#A5A9BB] outline-none focus:border-[#00F2FE]/50 transition"
              />
            </div>

            <button
              onClick={() => (user ? setShowCreate(true) : navigate('/login'))}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#1D4ED8] via-[#052E24] to-[#D4AF37] px-6 py-3 text-xs font-bold text-white shadow-[0_4px_20px_rgba(29,78,216,0.35)] transition hover:opacity-95 active:scale-95 whitespace-nowrap"
            >
              <FaPlus /> Sell Item
            </button>
          </div>
        </div>
      </div>

      {/* Category Pills */}
      <div className="mb-6 flex gap-2 overflow-x-auto pb-2 no-scrollbar">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setFilter(cat)}
            className={`whitespace-nowrap rounded-full px-5 py-2.5 text-xs font-bold transition ${
              filter === cat
                ? 'bg-gradient-to-r from-[#1D4ED8] to-[#0F766E] text-white shadow-lg shadow-[#1D4ED8]/25'
                : 'bg-[#070B14]/80 text-[#CBD5E1] border border-white/10 hover:bg-white/10'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
            <div key={n} className="relative h-72 rounded-3xl overflow-hidden bg-[#070B14]/90 border border-white/10 animate-pulse">
              <div className="h-44 bg-[#0A111E]" />
              <div className="p-4 space-y-2">
                <div className="h-3.5 bg-[#0A111E] rounded w-2/3" />
                <div className="h-2.5 bg-[#0A111E] rounded w-1/3" />
              </div>
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.04] to-transparent animate-[shimmer_2s_infinite]" />
            </div>
          ))}
        </div>
      ) : visibleItems.length === 0 ? (
        <div className="rounded-[28px] border border-white/10 bg-[#070B14]/40 py-16 text-center text-[#CBD5E1] shadow-sm backdrop-blur-xl text-sm">
          No items found in this category.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {visibleItems.map((item, i) => (
            <motion.div
              key={item._id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
            >
              <ProductCard
                item={item}
                onBuy={() => handleBuy(item)}
                onDelete={
                  filter === 'Mine' || String(item.createdBy) === String(myId)
                    ? () => handleDeleteItem(item._id)
                    : null
                }
              />
            </motion.div>
          ))}
        </div>
      )}

      {/* Create Listing Modal */}
      <AnimatePresence>
        {showCreate && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-4 py-6 backdrop-blur-xl">
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 12 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 12 }}
              className="w-full max-w-2xl overflow-hidden rounded-[30px] border border-white/15 bg-[#070B14]/95 shadow-2xl backdrop-blur-2xl"
            >
              <div className="border-b border-white/10 px-6 py-5 bg-[#171A26]/40">
                <h3 className="text-xl font-bold text-[#F7F7FC]">List New Item</h3>
                <p className="mt-1 text-xs text-[#CBD5E1]">
                  Publish an exclusive product to the SocialVerse marketplace.
                </p>
              </div>

              <div className="grid gap-6 p-6 md:grid-cols-[1fr_220px]">
                <div className="space-y-4">
                  <input
                    className="w-full rounded-2xl border border-white/10 bg-[#0A111E] px-4 py-3 text-xs text-[#F7F7FC] outline-none placeholder-[#A5A9BB] focus:border-[#00F2FE]/50"
                    placeholder="Item Title"
                    value={newItem.title}
                    onChange={(e) => setNewItem({ ...newItem, title: e.target.value })}
                  />

                  <div className="grid gap-4 md:grid-cols-2">
                    <input
                      className="w-full rounded-2xl border border-white/10 bg-[#0A111E] px-4 py-3 text-xs text-[#F7F7FC] outline-none placeholder-[#A5A9BB] focus:border-[#00F2FE]/50"
                      placeholder="Price in Coins"
                      type="number"
                      min="0"
                      value={newItem.price}
                      onChange={(e) => setNewItem({ ...newItem, price: e.target.value })}
                    />
                    <input
                      className="w-full rounded-2xl border border-white/10 bg-[#0A111E] px-4 py-3 text-xs text-[#F7F7FC] outline-none placeholder-[#A5A9BB] focus:border-[#00F2FE]/50"
                      placeholder="Stock quantity"
                      type="number"
                      min="1"
                      value={newItem.stock}
                      onChange={(e) => setNewItem({ ...newItem, stock: e.target.value })}
                    />
                  </div>

                  <select
                    className="w-full rounded-2xl border border-white/10 bg-[#0A111E] px-4 py-3 text-xs text-[#F7F7FC] outline-none focus:border-[#00F2FE]/50"
                    value={newItem.category}
                    onChange={(e) => setNewItem({ ...newItem, category: e.target.value })}
                  >
                    {CREATE_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat} className="bg-[#070B14] text-[#F7F7FC]">
                        {cat}
                      </option>
                    ))}
                  </select>

                  <textarea
                    className="h-28 w-full rounded-2xl border border-white/10 bg-[#0A111E] px-4 py-3 text-xs text-[#F7F7FC] outline-none placeholder-[#A5A9BB] focus:border-[#00F2FE]/50 resize-none leading-relaxed"
                    placeholder="Item description..."
                    value={newItem.description}
                    onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
                  />

                  <label className="flex cursor-pointer items-center gap-3 rounded-2xl border border-dashed border-white/20 bg-[#0A111E] px-4 py-3 text-xs text-[#CBD5E1] hover:border-white/40 transition">
                    <FaUpload className="text-[#00F2FE]" />
                    <span className="truncate">{imageFile ? imageFile.name : 'Upload product image'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                    />
                  </label>
                </div>

                <div className="space-y-4">
                  <div className="overflow-hidden rounded-[24px] border border-white/10 bg-black/50 shadow-inner">
                    <div className="aspect-[4/5] flex items-center justify-center">
                      {imagePreview ? (
                        <img
                          src={imagePreview}
                          alt="Preview"
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center text-center text-xs text-[#A5A9BB] p-4">
                          Image preview appears here
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-[#171A26]/80 p-3 text-xs text-[#CBD5E1] leading-relaxed">
                    High quality visuals and clear titles enhance listing visibility across the network.
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 border-t border-white/10 px-6 py-4 bg-[#171A26]/40">
                <button
                  onClick={() => {
                    setShowCreate(false);
                    setNewItem(emptyItem);
                    setImageFile(null);
                  }}
                  className="rounded-xl px-4 py-2.5 text-xs font-semibold text-[#A5A9BB] hover:text-[#F7F7FC] transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreate}
                  className="rounded-xl bg-gradient-to-r from-[#1D4ED8] via-[#052E24] to-[#D4AF37] px-5 py-2.5 text-xs font-bold text-white shadow-lg hover:opacity-95 transition"
                >
                  Publish Listing
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
