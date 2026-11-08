// frontend/src/pages/events/EventsPage.jsx
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FaCalendarPlus, FaMapMarkerAlt, FaUsers, FaClock, FaCalendarAlt, FaTrash } from 'react-icons/fa';
import API from '../../services/api';
import Spinner from '../../components/common/Spinner';
import { useToast } from '../../components/ui/ToastProvider';
import CreateEventModal from '../../components/events/CreateEventModal';
import { useSelector } from 'react-redux';

const EVENT_IMAGES = [
  'https://images.unsplash.com/photo-1511578314322-379afb476865?w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800&auto=format&fit=crop',
];

const DEMO_EVENTS = [
  {
    _id: 'event_showcase_1',
    title: 'Noir Gala 2026: Sovereign Creator Summit',
    location: 'Neo-Tokyo Grand Pavilion & Virtual Metaverse',
    date: new Date(Date.now() + 86400000 * 3).toISOString(),
    description: 'An exclusive annual congregation of visionary artists, decentralized media founders, and luxury creators.',
    image: 'https://images.unsplash.com/photo-1511578314322-379afb476865?w=800&auto=format&fit=crop',
    host: { name: 'Elena Rostova', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200' },
    attendees: ['user1', 'user2', 'user3', 'user4', 'user5']
  },
  {
    _id: 'event_showcase_2',
    title: 'Obsidian Soundscapes: Electronic Synthesis Night',
    location: 'London Tate Modern Cyber Hall',
    date: new Date(Date.now() + 86400000 * 7).toISOString(),
    description: 'A 6-hour immersive audiovisual journey featuring modular synthesizers and binaural reactive lasers.',
    image: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=800&auto=format&fit=crop',
    host: { name: 'Marcus Thorne', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200' },
    attendees: ['user1', 'user2', 'user3']
  },
  {
    _id: 'event_showcase_3',
    title: 'DeFi & Digital Treasury Round Table',
    location: 'Zurich Cryptographic Vault Club',
    date: new Date(Date.now() + 86400000 * 12).toISOString(),
    description: 'Private closed-door summit on decentralized social liquidity, P2P creator monetization, and Web3 social graphs.',
    image: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&auto=format&fit=crop',
    host: { name: 'Dr. Alistair Vance', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200' },
    attendees: ['user1', 'user2']
  }
];

export default function EventsPage() {
  const myId = useSelector(s => s.auth.user?._id);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('upcoming');
  const [showModal, setShowModal] = useState(false);
  const { add: addToast } = useToast();

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    try {
      setLoading(true);
      const res = await API.get('/apps/events');
      
      const eventData = Array.isArray(res.data) 
        ? res.data 
        : (Array.isArray(res.data?.data) ? res.data.data : []);

      setEvents(eventData && eventData.length > 0 ? eventData : DEMO_EVENTS);

    } catch (e) {
      console.error("Events error", e);
      addToast("Failed to load events", { type: 'error' });
      setEvents([]);
    } finally {
      setLoading(false);
    }
  };

  const handleJoin = async (id) => {
    try {
      await API.post(`/apps/events/${id}/join`);
      addToast("You joined the event!", { type: 'success' });
      loadEvents(); 
    } catch (e) {
      addToast("Failed to join", { type: 'error' });
    }
  };

  const handleDelete = async (id) => {
      if(!confirm("Are you sure you want to cancel this event?")) return;
      try {
          await API.delete(`/apps/events/${id}`);
          addToast("Event cancelled successfully", { type: 'info' });
          setEvents(prev => prev.filter(e => e._id !== id));
      } catch(e) { 
          addToast("Failed to delete event", { type: 'error' }); 
      }
  };

  // Filter Logic
  const filteredEvents = events.filter(evt => {
      if (filter === 'upcoming') return new Date(evt.date) > new Date();
      if (filter === 'my events') return evt.host?._id === myId || evt.attendees?.includes(myId);
      return true;
  });

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-6 min-h-screen">
      {/* Hero Section */}
      <div className="relative rounded-[32px] overflow-hidden bg-[#070B14]/90 border border-white/10 h-64 mb-8 flex items-center px-8 shadow-2xl backdrop-blur-xl">
        <div className="absolute inset-0 bg-gradient-to-r from-[#04070D] via-[#04070D]/85 to-transparent z-10" />
        <img 
          src="https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=1000" 
          className="absolute right-0 top-0 h-full w-2/3 object-cover opacity-40" 
          alt="hero" 
        />
        
        <div className="relative z-20 text-[#F7F7FC] max-w-lg">
          <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-[#00F2FE] mb-1">
            <FaCalendarAlt /> Community Gatherings
          </div>
          <h1 className="text-3xl md:text-4xl font-bold mb-2 font-display">Discover Events<span className="text-[#00F2FE]">.</span></h1>
          <p className="text-[#CBD5E1] text-sm mb-6">Find concerts, workshops, and exclusive meetups happening near you.</p>
          
          <button 
            onClick={() => setShowModal(true)}
            className="bg-gradient-to-r from-[#1D4ED8] via-[#052E24] to-[#D4AF37] text-white px-6 py-3 rounded-2xl font-bold text-xs flex items-center gap-2 hover:scale-105 transition shadow-[0_4px_20px_rgba(29,78,216,0.35)]"
          >
            <FaCalendarPlus /> Create Event
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 mb-6 border-b border-white/10 pb-1">
        {['upcoming', 'my events'].map(t => (
          <button 
            key={t} 
            onClick={() => setFilter(t)}
            className={`px-4 py-2 capitalize font-semibold text-xs tracking-wider transition ${
              filter === t 
                ? 'text-[#00F2FE] border-b-2 border-[#00F2FE]' 
                : 'text-[#A5A9BB] hover:text-[#F7F7FC]'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Events Grid */}
      {loading ? (
        <div className="flex justify-center p-10"><Spinner /></div>
      ) : filteredEvents.length === 0 ? (
        <div className="text-center p-12 text-[#CBD5E1] bg-[#070B14]/40 border border-white/10 rounded-3xl backdrop-blur-xl">
            <FaCalendarAlt className="mx-auto text-4xl mb-3 text-[#A5A9BB] opacity-30" />
            No events found. Be the first to create one!
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredEvents.map((evt, i) => {
            const isHost = String(evt.host?._id || evt.host) === String(myId);

            return (
                <motion.div 
                key={evt._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
                className="group bg-[#070B14]/90 rounded-3xl overflow-hidden shadow-xl hover:shadow-[0_8px_30px_rgba(29,78,216,0.2)] transition-all border border-white/10 hover:border-white/20 flex flex-col backdrop-blur-xl"
                >
                <div className="h-48 overflow-hidden relative bg-black/40">
                    <img 
                    src={evt.image || EVENT_IMAGES[i % EVENT_IMAGES.length]} 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                    alt={evt.title}
                    />
                    <div className="absolute top-3 left-3 bg-[#070B14]/85 border border-white/15 backdrop-blur-md text-[#F7F7FC] px-3 py-1 rounded-xl text-xs font-bold shadow-md flex flex-col items-center">
                      <span className="text-[10px] uppercase text-[#FF6B8A]">{new Date(evt.date).toLocaleString('default', { month: 'short' })}</span>
                      <span className="text-base leading-none mt-0.5">{new Date(evt.date).getDate()}</span>
                    </div>
                </div>
                
                <div className="p-5 flex-1 flex flex-col justify-between relative">
                    {isHost && (
                        <button 
                            onClick={(e) => { e.stopPropagation(); handleDelete(evt._id); }}
                            className="absolute top-4 right-4 text-[#A5A9BB] hover:text-[#F87171] p-2 rounded-full hover:bg-[#052E24]/20 transition z-10"
                            title="Cancel Event"
                        >
                            <FaTrash size={12} />
                        </button>
                    )}

                    <div>
                      <h3 className="font-bold text-base mb-2 line-clamp-1 pr-8 text-[#F7F7FC]">{evt.title}</h3>
                      <div className="flex flex-col gap-2 text-xs text-[#CBD5E1] mb-4">
                        <div className="flex items-center gap-2">
                            <FaMapMarkerAlt className="text-[#00F2FE]" /> {evt.location || 'Online'}
                        </div>
                        <div className="flex items-center gap-2">
                            <FaClock className="text-[#F4D49A]" /> {new Date(evt.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        </div>
                        <div className="flex items-center gap-2">
                            <FaUsers className="text-[#0F766E]" /> {evt.attendees?.length || 0} Attending
                        </div>
                      </div>
                    </div>
                    
                    <button 
                      onClick={() => handleJoin(evt._id)}
                      className="w-full py-2.5 rounded-2xl bg-gradient-to-r from-[#1D4ED8] to-[#0F766E] text-white text-xs font-bold hover:opacity-95 transition shadow-md"
                    >
                      Join Event
                    </button>
                </div>
                </motion.div>
            );
          })}
        </div>
      )}

      <CreateEventModal 
        isOpen={showModal} 
        onClose={() => setShowModal(false)} 
        onCreated={loadEvents} 
      />
    </div>
  );
}
