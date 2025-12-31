import React, { useState } from 'react';
import API from '../../services/api';
import { motion } from 'framer-motion';
import { FaTimes, FaCalendarAlt, FaMapMarkerAlt } from 'react-icons/fa';
import { useToast } from '../ui/ToastProvider';

export default function CreateEventModal({ isOpen, onClose, onCreated }) {
  const [form, setForm] = useState({ title: '', date: '', location: '', description: '' });
  const [loading, setLoading] = useState(false);
  const { add } = useToast();

  if (!isOpen) return null;

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await API.post('/apps/events', form);
      add('Event created successfully!', { type: 'success' });
      onCreated();
      onClose();
      setForm({ title: '', date: '', location: '', description: '' });
    } catch (e) {
      add('Failed to create event', { type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} className="bg-white dark:bg-gray-800 w-full max-w-md rounded-2xl p-6 shadow-2xl">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold">Host an Event</h3>
          <button onClick={onClose}><FaTimes /></button>
        </div>

        <form onSubmit={submit} className="space-y-3">
          <input 
            placeholder="Event Title" 
            className="w-full p-3 rounded-xl border dark:bg-gray-700 dark:border-gray-600"
            value={form.title} onChange={e => setForm({...form, title: e.target.value})} required
          />
          <textarea 
            placeholder="Description" 
            className="w-full p-3 rounded-xl border dark:bg-gray-700 dark:border-gray-600 h-24 resize-none"
            value={form.description} onChange={e => setForm({...form, description: e.target.value})}
          />
          <div className="flex gap-3">
            <div className="flex-1 relative">
              <FaCalendarAlt className="absolute top-3.5 left-3 text-gray-400" />
              <input 
                type="datetime-local" 
                className="w-full p-3 pl-10 rounded-xl border dark:bg-gray-700 dark:border-gray-600"
                value={form.date} onChange={e => setForm({...form, date: e.target.value})} required
              />
            </div>
          </div>
          <div className="relative">
            <FaMapMarkerAlt className="absolute top-3.5 left-3 text-gray-400" />
            <input 
              placeholder="Location (e.g. New York, Online)" 
              className="w-full p-3 pl-10 rounded-xl border dark:bg-gray-700 dark:border-gray-600"
              value={form.location} onChange={e => setForm({...form, location: e.target.value})} required
            />
          </div>

          <button disabled={loading} className="w-full btn-primary py-3 mt-2">
            {loading ? 'Creating...' : 'Create Event'}
          </button>
        </form>
      </motion.div>
    </div>
  );
}