// backend/controllers/integrationsController.js
const yahooFinance = require('yahoo-finance2').default;
const axios = require('axios');

// Cache to prevent spamming Yahoo
let marketCache = { data: null, lastFetch: 0 };
const CACHE_DURATION = 60 * 1000; // 1 Minute Cache

// --- MOCK DATA (Fallback if API fails) ---
const MOCK_MARKET_DATA = {
    rates: { USD: 1, INR: 83.50, EUR: 0.92, GBP: 0.79, JPY: 150.0 },
    metals: [
        { name: 'Gold', symbol: 'Gold', type: 'precious', unit: 'oz', price: 2030.50, change: 0.15 },
        { name: 'Silver', symbol: 'Silver', type: 'precious', unit: 'oz', price: 22.40, change: -0.5 },
        { name: 'Platinum', symbol: 'Plat', type: 'precious', unit: 'oz', price: 920.10, change: 0.2 },
        { name: 'Palladium', symbol: 'Pald', type: 'precious', unit: 'oz', price: 980.00, change: -1.2 },
        { name: 'Copper', symbol: 'Copper', type: 'industrial', unit: 'lbs', price: 3.85, change: 0.5 }
    ],
    fuel: [
        { name: 'Crude Oil (WTI)', unit: 'Barrel', price: 78.50, change: 1.2 },
        { name: 'Brent Crude', unit: 'Barrel', price: 82.10, change: 1.1 },
        { name: 'Natural Gas', unit: 'MMBtu', price: 1.80, change: -2.5 }
    ],
    // 🔥 NEW: Crypto Fallback
    crypto: [
        { name: 'Bitcoin', symbol: 'BTC', type: 'crypto', unit: 'USD', price: 65000.00, change: 1.5 },
        { name: 'Ethereum', symbol: 'ETH', type: 'crypto', unit: 'USD', price: 3500.00, change: 0.8 }
    ]
};

// --- NEWS CONTROLLER ---
exports.getNews = async (req, res) => {
  try {
    const { country = 'in', q } = req.query;
    const url = `https://newsdata.io/api/1/news?apikey=${process.env.NEWSDATA_API_KEY}&country=${country}&q=${q || 'top'}&language=en`;
    
    const response = await axios.get(url);
    
    if (!response.data || !response.data.results) throw new Error("No news data");

    const articles = response.data.results.map(article => ({
      title: article.title,
      link: article.link,
      image: article.image_url,
      source: article.source_id,
      date: article.pubDate,
      description: article.description
    }));
    res.json(articles);
  } catch (err) {
    console.error("News API Error (Returning Empty):", err.message);
    res.json([]); 
  }
};

// --- MARKETS CONTROLLER (Bulletproof) ---
exports.getMarkets = async (req, res) => {
  try {
    const now = Date.now();
    // 1. Serve Cache if fresh
    if (marketCache.data && (now - marketCache.lastFetch < CACHE_DURATION)) {
      return res.json(marketCache.data);
    }

    // 2. Try Fetching Live Data
    let results = [];
    let forex = [];
    
    try {
        yahooFinance.suppressNotices(['yahooSurvey']); 
        
        results = await yahooFinance.quote([
            'GC=F', 'SI=F', 'HG=F', 'PL=F', 'PA=F', // Metals
            'CL=F', 'BZ=F', 'NG=F',                 // Energy
            'BTC-USD', 'ETH-USD'                    // 🔥 NEW: Crypto
        ]);
        
        forex = await yahooFinance.quote(['INR=X', 'EUR=X', 'GBP=X', 'JPY=X']);
    } catch (apiErr) {
        console.warn("Yahoo API Failed (Using Mock Data):", apiErr.message);
        return res.json({ ...MOCK_MARKET_DATA, timestamp: now, source: 'mock' });
    }

    // 3. Helper to find symbol safely
    const get = (sym) => {
        const item = results.find(r => r.symbol === sym);
        return item || { regularMarketPrice: 0, regularMarketChangePercent: 0 };
    };

    // 4. Construct Live Response
    const rates = {
      USD: 1,
      INR: forex.find(f => f.symbol === 'INR=X')?.regularMarketPrice || 83.5,
      EUR: forex.find(f => f.symbol === 'EUR=X')?.regularMarketPrice || 0.92,
      GBP: forex.find(f => f.symbol === 'GBP=X')?.regularMarketPrice || 0.79,
      JPY: forex.find(f => f.symbol === 'JPY=X')?.regularMarketPrice || 150.0
    };

    const data = {
      rates,
      timestamp: now,
      source: 'live',
      metals: [
        { 
          name: 'Gold', symbol: 'Gold', type: 'precious', unit: 'oz',
          price: get('GC=F').regularMarketPrice || 2000, 
          change: get('GC=F').regularMarketChangePercent || 0
        },
        { 
          name: 'Silver', symbol: 'Silver', type: 'precious', unit: 'oz',
          price: get('SI=F').regularMarketPrice || 23, 
          change: get('SI=F').regularMarketChangePercent || 0
        },
        { 
          name: 'Platinum', symbol: 'Plat', type: 'precious', unit: 'oz',
          price: get('PL=F').regularMarketPrice || 900, 
          change: get('PL=F').regularMarketChangePercent || 0
        },
        { 
          name: 'Palladium', symbol: 'Pald', type: 'precious', unit: 'oz',
          price: get('PA=F').regularMarketPrice || 1000, 
          change: get('PA=F').regularMarketChangePercent || 0
        },
        { 
          name: 'Copper', symbol: 'Copper', type: 'industrial', unit: 'lbs',
          price: get('HG=F').regularMarketPrice || 3.8, 
          change: get('HG=F').regularMarketChangePercent || 0
        }
      ],
      fuel: [
        { 
          name: 'Crude Oil (WTI)', unit: 'Barrel',
          price: get('CL=F').regularMarketPrice || 75, 
          change: get('CL=F').regularMarketChangePercent || 0
        },
        { 
          name: 'Brent Crude', unit: 'Barrel',
          price: get('BZ=F').regularMarketPrice || 80, 
          change: get('BZ=F').regularMarketChangePercent || 0
        },
        { 
          name: 'Natural Gas', unit: 'MMBtu',
          price: get('NG=F').regularMarketPrice || 1.8, 
          change: get('NG=F').regularMarketChangePercent || 0
        }
      ],
      // 🔥 NEW: Crypto Section
      crypto: [
        { 
          name: 'Bitcoin', symbol: 'BTC', type: 'crypto', unit: 'USD',
          price: get('BTC-USD').regularMarketPrice, 
          change: get('BTC-USD').regularMarketChangePercent 
        },
        { 
          name: 'Ethereum', symbol: 'ETH', type: 'crypto', unit: 'USD',
          price: get('ETH-USD').regularMarketPrice, 
          change: get('ETH-USD').regularMarketChangePercent 
        }
      ]
    };

    marketCache = { data, lastFetch: now };
    res.json(data);

  } catch (err) {
    console.error("Critical Market Error:", err);
    res.json(MOCK_MARKET_DATA); 
  }
};


// 🔥 NEW: Get TURN Credentials via Metered
exports.getTurnCredentials = async (req, res) => {
  try {
    const { METERED_DOMAIN, METERED_API_KEY } = process.env;

    // Use the specific endpoint from your snippet
    const url = `https://${METERED_DOMAIN}/api/v1/turn/credentials?apiKey=${METERED_API_KEY}`;
    
    const response = await axios.get(url);
    
    // Send the array of ICE servers back to the frontend
    res.json(response.data); 
  } catch (err) {
    console.error("TURN Fetch Error:", err.message);
    // Fallback to free public STUN servers if Metered fails
    res.json([
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:global.stun.twilio.com:3478' }
    ]);
  }
};