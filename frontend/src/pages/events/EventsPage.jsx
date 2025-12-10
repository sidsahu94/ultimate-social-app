import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FaCalendarPlus, FaMapMarkerAlt, FaUsers, FaClock, FaCalendarAlt } from 'react-icons/fa';
import API from '../../services/api';
import Spinner from '../../components/common/Spinner';
import { useToast } from '../../components/ui/ToastProvider';

export default function EventsPage() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('upcoming');
  const { add: addToast } = useToast();

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    try {
      setLoading(true);
      // Calls the new Apps Controller endpoint
      const res = await API.get('/apps/events');
      setEvents(res.data || []);
    } catch (e) {
      console.error("Events error", e);
      addToast("Failed to load events", { type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleJoin = async (id) => {
    try {
      await API.post(`/apps/events/${id}/join`);
      addToast("You joined the event!", { type: 'success' });
      loadEvents(); // Refresh list to show updated attendee count
    } catch (e) {
      addToast("Failed to join", { type: 'error' });
    }
  };

  const handleCreate = async () => {
    // For a real app, you'd open a modal here.
    // For this demo, we'll create a quick test event to verify the DB works.
    const title = prompt("Event Title:");
    if (!title) return;
    
    try {
      await API.post('/apps/events', {
        title,
        date: new Date(Date.now() + 86400000), // Tomorrow
        location: 'Virtual',
        description: 'Community meetup'
      });
      addToast("Event created!", { type: 'success' });
      loadEvents();
    } catch (e) {
      addToast("Failed to create", { type: 'error' });
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-4">
      {/* Hero Section */}
      <div className="relative rounded-3xl overflow-hidden bg-indigo-900 h-64 mb-8 flex items-center px-8 shadow-2xl">
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-900 via-indigo-900/80 to-transparent z-10" />
        <img src="https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=1000" className="absolute right-0 top-0 h-full w-2/3 object-cover opacity-50" alt="hero" />
        
        <div className="relative z-20 text-white max-w-lg">
          <h1 className="text-4xl font-bold mb-2">Discover Events</h1>
          <p className="text-indigo-200 mb-6">Find concerts, workshops, and meetups happening near you.</p>
          <button 
            onClick={handleCreate}
            className="bg-white text-indigo-900 px-6 py-3 rounded-full font-bold flex items-center gap-2 hover:scale-105 transition shadow-lg"
          >
            <FaCalendarPlus /> Create Event
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 mb-6 border-b dark:border-gray-800 pb-1">
        {['upcoming', 'my events'].map(t => (
          <button 
            key={t}
            onClick={() => setFilter(t)}
            className={`px-4 py-2 capitalize font-medium transition ${filter === t ? 'text-indigo-500 border-b-2 border-indigo-500' : 'text-gray-500 hover:text-gray-400'}`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Events Grid */}
      {loading ? (
        <div className="flex justify-center p-10"><Spinner /></div>
      ) : events.length === 0 ? (
        <div className="text-center p-10 text-gray-500 bg-gray-100 dark:bg-gray-800 rounded-xl">
            <FaCalendarAlt className="mx-auto text-4xl mb-3 opacity-30" />
            No upcoming events found. Be the first to create one!
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.map((evt, i) => (
            <motion.div 
              key={evt._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="group bg-white dark:bg-gray-800 rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all border border-gray-100 dark:border-gray-700 flex flex-col"
            >
              <div className="h-48 overflow-hidden relative bg-gray-200">
                <img 
                  src={evt.image || `https://source.unsplash.com/random/500x300?event&sig=${i}`} 
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" 
                  alt={evt.title}
                />
                <div className="absolute top-3 left-3 bg-white/90 backdrop-blur text-black px-3 py-1 rounded-lg text-xs font-bold shadow-sm flex flex-col items-center">
                  <span className="text-xs uppercase text-red-500">{new Date(evt.date).toLocaleString('default', { month: 'short' })}</span>
                  <span className="text-lg leading-none">{new Date(evt.date).getDate()}</span>
                </div>
              </div>
              
              <div className="p-5 flex-1 flex flex-col">
                <h3 className="font-bold text-lg mb-2 line-clamp-1">{evt.title}</h3>
                <div className="flex flex-col gap-2 text-sm text-gray-500 dark:text-gray-400 mb-4 flex-1">
                  <div className="flex items-center gap-2">
                    <FaMapMarkerAlt className="text-indigo-500" /> {evt.location || 'Online'}
                  </div>
                  <div className="flex items-center gap-2">
                    <FaClock className="text-orange-500" /> {new Date(evt.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                  </div>
                  <div className="flex items-center gap-2">
                    <FaUsers className="text-green-500" /> {evt.attendees?.length || 0} Going
                  </div>
                </div>
                
                <button 
                  onClick={() => handleJoin(evt._id)}
                  className="w-full py-2 rounded-xl bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-300 font-semibold hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition"
                >
                  Join Event
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}