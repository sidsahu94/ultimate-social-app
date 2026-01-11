// frontend/src/pages/shop/Marketplace.jsx
import React, { useState, useEffect } from 'react';
import API from '../../services/api';
import ProductCard from '../../components/shop/ProductCard';
import { FaSearch, FaPlus, FaStore } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '../../components/ui/ToastProvider';
import { useSelector, useDispatch } from 'react-redux';
import { updateAuthUser } from '../../redux/slices/authSlice'; // 🔥 Import Redux action

const CATEGORIES = ['All', 'Digital', 'Services', 'Merch', 'NFTs', 'Mine'];

export default function Marketplace() {
  const [items, setItems] = useState([]);
  const [filter, setFilter] = useState('All');
  const [showCreate, setShowCreate] = useState(false);
  const [newItem, setNewItem] = useState({ title: '', price: '', desc: '' });
  
  const { add } = useToast();
  const dispatch = useDispatch();
  
  // Get current user from Redux
  const { user } = useSelector(s => s.auth);
  const myId = user?._id;

  useEffect(() => { loadItems(); }, []);

  const loadItems = async () => {
    try {
      const res = await API.get('/shop');
      setItems(res.data);
    } catch (e) { console.error(e); }
  };

  const handleCreate = async () => {
    try {
      await API.post('/shop', { ...newItem, price: Number(newItem.price) });
      add('Listing created!', { type: 'success' });
      setShowCreate(false);
      loadItems();
      setNewItem({ title: '', price: '', desc: '' });
    } catch (e) { add('Failed to create', { type: 'error' }); }
  };

  const handleDeleteItem = async (itemId) => {
    if(!confirm("Remove listing?")) return;
    try {
        await API.delete(`/shop/${itemId}`);
        setItems(prev => prev.filter(i => i._id !== itemId));
        add("Listing removed", { type: 'info' });
    } catch(e) { 
        add("Failed to delete", { type: 'error' }); 
    }
  };

  // 🔥 NEW: Real Purchase Logic
  const handleBuy = async (item) => {
    if (!user) return add("Please login to buy items", { type: 'error' });
    if (!confirm(`Buy "${item.title}" for ${item.price} coins?`)) return;

    try {
      // 1. Call API to execute transaction
      await API.post(`/shop/${item._id}/buy`);
      
      add(`Successfully purchased ${item.title}!`, { type: 'success' });
      
      // 2. Update Local Item State (Decrease stock visually)
      setItems(prev => prev.map(i => {
          if (i._id === item._id) {
              return { ...i, stock: (i.stock || 1) - 1 };
          }
          return i;
      }));

      // 3. Update Redux Wallet immediately so UI reflects new balance
      const currentBalance = user.wallet?.balance || 0;
      dispatch(updateAuthUser({ 
          wallet: { 
              ...user.wallet, 
              balance: currentBalance - item.price 
          } 
      }));

    } catch (e) {
      add(e.userMessage || 'Purchase failed (Insufficient funds?)', { type: 'error' });
    }
  };

  // Filter Logic
  const filteredItems = filter === 'Mine' 
    ? items.filter(i => i.owner?._id === myId || i.createdBy === myId)
    : (filter === 'All' ? items : items.filter(i => i.category === filter));

  return (
    <div className="max-w-6xl mx-auto p-4 min-h-screen">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-black bg-gradient-to-r from-orange-500 to-red-500 bg-clip-text text-transparent flex items-center gap-2">
            <FaStore /> Marketplace
          </h1>
          <p className="text-gray-500 text-sm">Buy, sell, and trade with the community.</p>
        </div>
        
        <div className="flex gap-2 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <FaSearch className="absolute left-3 top-3 text-gray-400" />
            <input placeholder="Search items..." className="w-full pl-10 p-2.5 rounded-xl bg-white dark:bg-gray-800 border dark:border-gray-700" />
          </div>
          <button 
            onClick={() => setShowCreate(true)}
            className="bg-black dark:bg-white dark:text-black text-white px-4 py-2 rounded-xl font-bold flex items-center gap-2 hover:scale-105 transition"
          >
            <FaPlus /> Sell
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2 overflow-x-auto pb-4 no-scrollbar">
        {CATEGORIES.map(cat => (
          <button 
            key={cat}
            onClick={() => setFilter(cat)}
            className={`px-5 py-2 rounded-full font-medium whitespace-nowrap transition ${filter === cat ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/30' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300'}`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Grid */}
      {filteredItems.length === 0 ? (
          <div className="text-center py-10 text-gray-500">No items found in this category.</div>
      ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredItems.map((item, i) => (
              <motion.div key={item._id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                <ProductCard 
                    item={item} 
                    onBuy={() => handleBuy(item)} // 🔥 Use real handler
                    onDelete={filter === 'Mine' || item.createdBy === myId ? () => handleDeleteItem(item._id) : null}
                />
              </motion.div>
            ))}
          </div>
      )}

      {/* Create Modal */}
      <AnimatePresence>
        {showCreate && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }} className="bg-white dark:bg-gray-800 p-6 rounded-2xl w-full max-w-md shadow-2xl">
              <h3 className="text-xl font-bold mb-4">List New Item</h3>
              <div className="space-y-3">
                <input 
                  className="w-full p-3 rounded-lg border dark:bg-gray-700 dark:border-gray-600" 
                  placeholder="Item Title"
                  value={newItem.title}
                  onChange={e => setNewItem({...newItem, title: e.target.value})}
                />
                <input 
                  className="w-full p-3 rounded-lg border dark:bg-gray-700 dark:border-gray-600" 
                  placeholder="Price (Coins)"
                  type="number"
                  value={newItem.price}
                  onChange={e => setNewItem({...newItem, price: e.target.value})}
                />
                <textarea 
                  className="w-full p-3 rounded-lg border dark:bg-gray-700 dark:border-gray-600 h-24" 
                  placeholder="Description"
                  value={newItem.desc}
                  onChange={e => setNewItem({...newItem, desc: e.target.value})}
                />
                <div className="flex justify-end gap-2 mt-4">
                  <button onClick={() => setShowCreate(false)} className="px-4 py-2 text-gray-500">Cancel</button>
                  <button onClick={handleCreate} className="btn-primary">Create Listing</button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}