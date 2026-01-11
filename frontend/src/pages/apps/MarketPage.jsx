// frontend/src/pages/apps/MarketPage.jsx
import React, { useState, useEffect } from 'react';
import API from '../../services/api';
import { FaChartLine, FaGasPump, FaGem, FaIndustry, FaArrowUp, FaArrowDown, FaSync, FaMoneyBillWave } from 'react-icons/fa';
import Spinner from '../../components/common/Spinner';

const CURRENCIES = [
    { code: 'USD', symbol: '$', name: 'US Dollar' },
    { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
    { code: 'EUR', symbol: '€', name: 'Euro' },
    { code: 'GBP', symbol: '£', name: 'British Pound' },
    { code: 'JPY', symbol: '¥', name: 'Japanese Yen' }
];

export default function MarketPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currency, setCurrency] = useState('USD');

  const fetchMarket = async () => {
    setLoading(true);
    try {
      const r = await API.get('/integrations/markets');
      setData(r.data);
    } catch (e) { 
        console.error(e); 
    } finally { 
        setLoading(false); 
    }
  };

  useEffect(() => { fetchMarket(); }, []);

  const getPrice = (basePriceUSD) => {
      if (!data || !data.rates) return basePriceUSD;
      const rate = data.rates[currency] || 1;
      const converted = basePriceUSD * rate;
      
      const symbol = CURRENCIES.find(c => c.code === currency)?.symbol || '$';
      
      return `${symbol}${converted.toLocaleString(undefined, {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2
      })}`;
  };

  const PriceCard = ({ title, price, unit, change, icon, color, type }) => (
    <div className={`p-5 rounded-2xl shadow-sm border relative overflow-hidden group hover:shadow-lg transition ${type === 'industrial' ? 'bg-gray-100 dark:bg-gray-800 border-gray-200 dark:border-gray-700' : 'bg-white dark:bg-gray-900 border-gray-100 dark:border-gray-800'}`}>
      <div className={`absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition ${color} rounded-bl-3xl`}>
        {icon}
      </div>
      <div className="flex items-center gap-3 mb-2">
        <div className={`p-2 rounded-lg ${color} bg-opacity-10 text-opacity-100`}>
          {React.cloneElement(icon, { size: 18 })}
        </div>
        <span className="font-bold text-gray-500 text-xs uppercase tracking-wider">{title}</span>
      </div>
      <div className="text-2xl font-black text-gray-800 dark:text-white mb-1">
        {getPrice(price)}
      </div>
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-gray-400">per {unit}</span>
        {change !== undefined && change !== 0 && (
          <span className={`text-xs font-bold flex items-center gap-1 ${change >= 0 ? 'text-green-500' : 'text-red-500'}`}>
            {change >= 0 ? <FaArrowUp size={10} /> : <FaArrowDown size={10} />} {Math.abs(change).toFixed(2)}%
          </span>
        )}
      </div>
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto p-4 min-h-screen pb-20">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="p-3 bg-yellow-100 text-yellow-600 rounded-xl"><FaChartLine size={24} /></div>
          <div>
            <h1 className="text-2xl font-bold dark:text-white">Global Markets</h1>
            <p className="text-xs text-gray-500">Live Metals & Energy Data</p>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="flex items-center bg-white dark:bg-gray-800 border dark:border-gray-700 px-3 py-2 rounded-xl shadow-sm flex-1">
                <FaMoneyBillWave className="text-green-500 mr-2" />
                <select 
                    value={currency} 
                    onChange={(e) => setCurrency(e.target.value)}
                    className="bg-transparent outline-none text-sm font-bold text-gray-700 dark:text-gray-200 cursor-pointer"
                >
                    {CURRENCIES.map(c => (
                        <option key={c.code} value={c.code}>{c.code} - {c.symbol}</option>
                    ))}
                </select>
            </div>
            <button onClick={fetchMarket} className="p-3 bg-gray-100 dark:bg-gray-800 rounded-xl hover:rotate-180 transition duration-500 shadow-sm border dark:border-gray-700">
                <FaSync className="text-gray-500" />
            </button>
        </div>
      </div>

      {loading ? <div className="flex justify-center p-10"><Spinner /></div> : (
        <div className="space-y-8 animate-fade-in">
          
          {/* Precious Metals */}
          <section>
            <h3 className="text-sm font-bold mb-4 flex items-center gap-2 text-gray-500 uppercase tracking-widest">
              <FaGem className="text-indigo-500" /> Precious Metals
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {data?.metals.filter(m => m.type === 'precious').map(m => (
                <PriceCard 
                  key={m.symbol}
                  title={m.name} 
                  price={m.price} 
                  change={m.change}
                  unit={m.unit}
                  icon={<FaGem />} 
                  color="text-indigo-500 bg-indigo-500"
                />
              ))}
            </div>
          </section>

          {/* Industrial Metals */}
          <section>
            <h3 className="text-sm font-bold mb-4 flex items-center gap-2 text-gray-500 uppercase tracking-widest">
              <FaIndustry className="text-gray-600" /> Industrial Metals
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {data?.metals.filter(m => m.type === 'industrial').map(m => (
                <PriceCard 
                  key={m.symbol}
                  title={m.name} 
                  price={m.price} 
                  change={m.change}
                  unit={m.unit}
                  icon={<FaIndustry />} 
                  type="industrial"
                  color="text-gray-600 bg-gray-600"
                />
              ))}
            </div>
          </section>

          {/* Energy */}
          <section>
            <h3 className="text-sm font-bold mb-4 flex items-center gap-2 text-gray-500 uppercase tracking-widest">
              <FaGasPump className="text-red-500" /> Global Energy
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {data?.fuel.map(f => (
                <PriceCard 
                  key={f.name}
                  title={f.name} 
                  price={f.price} 
                  change={f.change}
                  unit={f.unit}
                  icon={<FaGasPump />} 
                  color="text-red-500 bg-red-500"
                />
              ))}
            </div>
          </section>

        </div>
      )}
    </div>
  );
}