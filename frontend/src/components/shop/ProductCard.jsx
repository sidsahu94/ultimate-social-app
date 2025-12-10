import React from 'react';
import { FaTag, FaGavel } from 'react-icons/fa';

export default function ProductCard({ item, onBuy }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all group">
      <div className="relative h-48 overflow-hidden bg-gray-200">
        <img 
          src={item.image || '/default-product.png'} 
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" 
          alt={item.title}
        />
        <div className="absolute top-2 right-2 bg-black/70 backdrop-blur text-white px-2 py-1 rounded text-xs font-bold">
          {item.stock > 0 ? `${item.stock} left` : 'Sold Out'}
        </div>
      </div>
      
      <div className="p-4">
        <div className="flex justify-between items-start mb-2">
          <h3 className="font-bold text-lg leading-tight">{item.title}</h3>
          <span className="text-green-600 font-black text-lg">₹{item.price}</span>
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 line-clamp-2">{item.description}</p>
        
        <div className="flex gap-2">
          <button 
            onClick={onBuy}
            className="flex-1 bg-black dark:bg-white dark:text-black text-white py-2 rounded-lg font-bold hover:opacity-80 transition flex items-center justify-center gap-2"
          >
            <FaTag /> Buy Now
          </button>
          <button className="px-3 bg-gray-100 dark:bg-gray-700 rounded-lg text-indigo-500 hover:bg-indigo-50 transition">
            <FaGavel />
          </button>
        </div>
      </div>
    </div>
  );
}