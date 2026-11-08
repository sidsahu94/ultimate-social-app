// frontend/src/components/shop/ProductCard.jsx
import React from 'react';
import { FaTag, FaGavel, FaTrash } from 'react-icons/fa';

export default function ProductCard({ item, onBuy, onDelete }) {
  return (
    <div className="bg-[#070B14]/90 border border-white/10 rounded-3xl overflow-hidden shadow-xl hover:shadow-[0_8px_30px_rgba(29,78,216,0.2)] hover:border-white/20 transition-all duration-300 group flex flex-col h-full backdrop-blur-xl">
      <div className="relative h-48 overflow-hidden bg-black/40">
        <img 
          src={item.image || '/default-product.png'} 
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
          alt={item.title}
        />
        <div className="absolute top-2.5 right-2.5 bg-[#070B14]/80 border border-white/15 backdrop-blur-md text-[#CBD5E1] px-2.5 py-1 rounded-full text-[10px] font-bold">
          {item.stock > 0 ? `${item.stock} in stock` : 'Sold Out'}
        </div>
      </div>
      
      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          <div className="flex justify-between items-start gap-2 mb-1.5">
            <h3 className="font-bold text-[#F7F7FC] text-sm leading-tight line-clamp-1">{item.title}</h3>
            <span className="text-[#F4D49A] font-black text-sm whitespace-nowrap">₹{item.price}</span>
          </div>
          <p className="text-xs text-[#CBD5E1] mb-4 line-clamp-2 leading-relaxed">{item.description}</p>
        </div>
        
        <div className="flex gap-2 pt-2">
          <button 
            onClick={onBuy}
            disabled={item.stock <= 0}
            className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-md ${
              item.stock > 0 
                ? 'bg-gradient-to-r from-[#1D4ED8] to-[#0F766E] text-white hover:opacity-95 active:scale-95' 
                : 'bg-white/10 text-white/40 cursor-not-allowed'
            }`}
          >
            <FaTag size={11} /> {item.stock > 0 ? 'Buy Now' : 'Sold Out'}
          </button>
          
          {onDelete ? (
            <button 
                onClick={onDelete} 
                className="px-3 bg-[#052E24]/20 border border-[#052E24]/30 text-[#F87171] rounded-xl hover:bg-[#052E24]/40 transition flex items-center justify-center text-xs"
                title="Delete Listing"
            >
                <FaTrash />
            </button>
          ) : (
            <button className="px-3 bg-[#171A26] border border-white/10 rounded-xl text-[#00F2FE] hover:bg-white/10 transition flex items-center justify-center text-xs">
                <FaGavel />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
