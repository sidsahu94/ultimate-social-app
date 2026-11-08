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

const FALLBACK_MARKETS = {
  rates: { USD: 1, INR: 83.50, EUR: 0.92, GBP: 0.79, JPY: 150.0 },
  metals: [
    { name: 'Gold Bullion', symbol: 'Gold', type: 'precious', unit: 'oz', price: 2740.50, change: 0.85 },
    { name: 'Silver Fine', symbol: 'Silver', type: 'precious', unit: 'oz', price: 34.20, change: 1.4 },
    { name: 'Platinum Sovereign', symbol: 'Plat', type: 'precious', unit: 'oz', price: 1040.10, change: 0.6 },
    { name: 'Palladium Reserve', symbol: 'Pald', type: 'precious', unit: 'oz', price: 1120.00, change: -0.4 },
    { name: 'Copper Grade A', symbol: 'Copper', type: 'industrial', unit: 'lbs', price: 4.65, change: 0.9 }
  ],
  fuel: [
    { name: 'Crude Oil (WTI)', unit: 'Barrel', price: 74.50, change: 1.2 },
    { name: 'Brent Crude', unit: 'Barrel', price: 78.10, change: 0.8 },
    { name: 'Natural Gas', unit: 'MMBtu', price: 2.40, change: -1.5 }
  ],
  crypto: [
    { name: 'Bitcoin', symbol: 'BTC', type: 'crypto', unit: 'USD', price: 88500.00, change: 3.5 },
    { name: 'Ethereum', symbol: 'ETH', type: 'crypto', unit: 'USD', price: 3150.00, change: 2.1 }
  ]
};

export default function MarketPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currency, setCurrency] = useState('USD');

  const fetchMarket = async () => {
    setLoading(true);
    try {
      const r = await API.get('/integrations/markets');
      const payload = r.data?.data || r.data;
      setData(payload && payload.metals ? payload : FALLBACK_MARKETS);
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

  const PriceCard = ({ title, price, unit, change, icon, color }) => (
    <div className="bg-[#070B14]/90 border border-white/10 p-5 rounded-3xl shadow-xl relative overflow-hidden group hover:border-white/20 hover:shadow-[0_8px_30px_rgba(29,78,216,0.18)] transition-all backdrop-blur-xl">
      <div className={`absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-25 transition ${color} rounded-bl-3xl`}>
        {icon}
      </div>
      <div className="flex items-center gap-3 mb-2.5">
        <div className={`p-2 rounded-xl bg-white/5 border border-white/10 ${color}`}>
          {React.cloneElement(icon, { size: 16 })}
        </div>
        <span className="font-bold text-[#CBD5E1] text-[11px] uppercase tracking-wider">{title}</span>
      </div>
      <div className="text-2xl font-black text-[#F4D49A] mb-1 font-mono">
        {getPrice(price)}
      </div>
      <div className="flex items-center justify-between mt-2 pt-2 border-t border-white/5">
        <span className="text-[11px] font-medium text-[#A5A9BB]">per {unit}</span>
        {change !== undefined && change !== 0 && (
          <span className={`text-[11px] font-bold flex items-center gap-1 ${change >= 0 ? 'text-[#00F2FE]' : 'text-[#F87171]'}`}>
            {change >= 0 ? <FaArrowUp size={9} /> : <FaArrowDown size={9} />} {Math.abs(change).toFixed(2)}%
          </span>
        )}
      </div>
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-6 min-h-screen pb-24">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4 pb-4 border-b border-white/10">
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="p-3 bg-[#D4AF37]/20 border border-[#D4AF37]/30 text-[#F4D49A] rounded-2xl shadow-[0_0_15px_rgba(212,140,123,0.25)]">
            <FaChartLine size={20} />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-black text-[#F7F7FC] tracking-tight font-display">Global Telemetry<span className="text-[#00F2FE]">.</span></h1>
            <p className="text-xs text-[#CBD5E1] mt-0.5">Live Commodities, Energy Indices & Forex Pricing</p>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="flex items-center bg-[#070B14] border border-white/10 px-3.5 py-2.5 rounded-2xl shadow-sm flex-1">
                <FaMoneyBillWave className="text-[#00F2FE] mr-2" size={14} />
                <select 
                    value={currency} 
                    onChange={(e) => setCurrency(e.target.value)}
                    className="bg-transparent outline-none text-xs font-bold text-[#F7F7FC] cursor-pointer"
                >
                    {CURRENCIES.map(c => (
                        <option key={c.code} value={c.code} className="bg-[#070B14] text-[#F7F7FC]">{c.code} - {c.symbol}</option>
                    ))}
                </select>
            </div>
            <button onClick={fetchMarket} className="p-3 bg-[#070B14] hover:bg-white/10 rounded-2xl transition duration-500 shadow-sm border border-white/10 text-[#A5A9BB] hover:text-white">
                <FaSync size={14} />
            </button>
        </div>
      </div>

      {loading ? <div className="flex justify-center p-12"><Spinner /></div> : (
        <div className="space-y-8 animate-fade-in">
          
          {/* Precious Metals */}
          <section>
            <h3 className="text-xs font-bold mb-4 flex items-center gap-2 text-[#D4AF37] uppercase tracking-widest">
              <FaGem className="text-[#D4AF37]" /> Precious Metals
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {data?.metals?.filter(m => m.type === 'precious').map(m => (
                <PriceCard 
                  key={m.symbol}
                  title={m.name} 
                  price={m.price} 
                  change={m.change}
                  unit={m.unit}
                  icon={<FaGem />} 
                  color="text-[#F4D49A]"
                />
              ))}
            </div>
          </section>

          {/* Industrial Metals */}
          <section>
            <h3 className="text-xs font-bold mb-4 flex items-center gap-2 text-[#00F2FE] uppercase tracking-widest">
              <FaIndustry className="text-[#00F2FE]" /> Industrial Metals
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {data?.metals?.filter(m => m.type === 'industrial').map(m => (
                <PriceCard 
                  key={m.symbol}
                  title={m.name} 
                  price={m.price} 
                  change={m.change}
                  unit={m.unit}
                  icon={<FaIndustry />} 
                  color="text-[#00F2FE]"
                />
              ))}
            </div>
          </section>

          {/* Energy */}
          <section>
            <h3 className="text-xs font-bold mb-4 flex items-center gap-2 text-[#10B981] uppercase tracking-widest">
              <FaGasPump className="text-[#10B981]" /> Global Energy
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {data?.fuel?.map(f => (
                <PriceCard 
                  key={f.name}
                  title={f.name} 
                  price={f.price} 
                  change={f.change}
                  unit={f.unit}
                  icon={<FaGasPump />} 
                  color="text-[#10B981]"
                />
              ))}
            </div>
          </section>

        </div>
      )}
    </div>
  );
}
