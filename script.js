// State
const state = {
    location: 'Kolkata',
    currency: 'INR',
    weight: '10g',
    goldPurity: '24K',
    isDarkTheme: false,
    data: null,
    notificationsEnabled: false,
    notifiedTimestamps: {},
    charts: {
        gold: null,
        silver: null,
        copper: null
    },
    chartTimes: {
        gold: '7d',
        silver: '7d',
        copper: '7d'
    }
};

// Exchange rate (Dynamic)
let USD_TO_INR = 83.5;

// Base Prices per gram in USD
const BASE_PRICES_USD = {
    gold: 75.50, // per gram
    silver: 0.95, // per gram
    copper: 0.009 // per gram
};

// Location Multipliers (Taxes/Demand adjustments)
const LOCATION_MULTIPLIERS = {
    'Kolkata': 1.05,
    'Mumbai': 1.06,
    'Delhi': 1.04,
    'NewYork': 1.00,
    'London': 1.01,
    'Dubai': 0.99
};

// Gold Purity Multipliers
const PURITY_MULTIPLIERS = {
    '24K': 1.0,
    '22K': 0.916,
    '20K': 0.833,
    '18K': 0.750
};

// DOM Elements
const elements = {
    notifyToggle: document.getElementById('notify-toggle'),
    themeToggle: document.getElementById('theme-toggle'),
    themeIcon: document.getElementById('theme-icon'),
    timestamp: document.getElementById('timestamp'),
    cards: document.querySelectorAll('.commodity-card')
};

// Fetch from Local API
async function fetchCommodityData() {
    try {
        const response = await fetch('http://127.0.0.1:5000/api/commodities');
        if (!response.ok) throw new Error('Network response was not ok');
        const apiData = await response.json();
        
        // Update global exchange rate
        if (apiData.exchange_rate) {
            USD_TO_INR = apiData.exchange_rate;
        }

        const locMult = LOCATION_MULTIPLIERS[state.location];
        
        // Apply location multiplier to prices
        const applyLocationMult = (history) => history.map(p => p * locMult);

        // Update UI indicator
        document.getElementById('api-status').textContent = "Using Live Market Data";
        document.getElementById('api-status').style.color = "var(--success-color)";

        return {
            timestamp: apiData.timestamp,
            prices: {
                gold: { 
                    current: apiData.prices.gold.current * locMult, 
                    history: applyLocationMult(apiData.prices.gold.history),
                    history_1d: applyLocationMult(apiData.prices.gold.history_1d || []) 
                },
                silver: { 
                    current: apiData.prices.silver.current * locMult, 
                    history: applyLocationMult(apiData.prices.silver.history),
                    history_1d: applyLocationMult(apiData.prices.silver.history_1d || []) 
                },
                copper: { 
                    current: apiData.prices.copper.current * locMult, 
                    history: applyLocationMult(apiData.prices.copper.history),
                    history_1d: applyLocationMult(apiData.prices.copper.history_1d || []) 
                }
            }
        };
    } catch (error) {
        console.warn('Failed to fetch from API, using mock data:', error);
        document.getElementById('api-status').textContent = "Using Mock Data API (Server Offline)";
        document.getElementById('api-status').style.color = "var(--danger-color)";
        // Fallback to mock logic
        return new Promise((resolve) => {
            const locMult = LOCATION_MULTIPLIERS[state.location];
            
            // Generate some random fluctuation for realism (-1% to +1%)
            const randomFluctuation = () => 1 + (Math.random() * 0.02 - 0.01);
            
            const goldBase = BASE_PRICES_USD.gold * locMult * randomFluctuation();
            const silverBase = BASE_PRICES_USD.silver * locMult * randomFluctuation();
            const copperBase = BASE_PRICES_USD.copper * locMult * randomFluctuation();

            // Generate 30-day history based on the current base price
            const generateHistory = (currentPrice) => {
                let history = [];
                let price = currentPrice;
                for(let i=0; i<30; i++) {
                    history.unshift(price);
                    price = price * (1 + (Math.random() * 0.03 - 0.015)); // reverse step
                }
                return history;
            };

            const goldHistory = generateHistory(goldBase);
            const silverHistory = generateHistory(silverBase);
            const copperHistory = generateHistory(copperBase);

            resolve({
                timestamp: new Date().toISOString(),
                prices: {
                    gold: { current: goldBase, history: goldHistory },
                    silver: { current: silverBase, history: silverHistory },
                    copper: { current: copperBase, history: copperHistory }
                }
            });
        });
    }
}

// Convert USD to INR if needed, format to 2 decimal places
function formatPrice(priceUSD) {
    let finalPrice = priceUSD;
    
    if (state.currency === 'INR') {
        finalPrice *= USD_TO_INR;
    }
    
    // Format with commas and 2 decimal places
    return finalPrice.toLocaleString(state.currency === 'INR' ? 'en-IN' : 'en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
}

// Calculate percentage change
function calculateTrend(history) {
    const latest = history[history.length - 1];
    const previous = history[history.length - 2];
    const change = ((latest - previous) / previous) * 100;
    return change;
}

// Update UI
function updateUI() {
    if (!state.data) return;

    const currencySymbol = state.currency === 'INR' ? '₹' : '$';
    document.querySelectorAll('.currency-symbol').forEach(el => el.textContent = currencySymbol);

    const prices = state.data.prices;
    const purityMult = PURITY_MULTIPLIERS[state.goldPurity];
    const weightMult = state.weight === '10g' ? 10 : (state.weight === '1kg' ? 1000 : 1);
    const weightUnitText = `/ ${state.weight}`;

    // Update Gold
    const goldPrice = prices.gold.current * purityMult * weightMult;
    document.getElementById('gold-price-main').textContent = formatPrice(goldPrice);
    document.getElementById('gold-unit-main').textContent = weightUnitText;
    updateTrendElement('gold', prices.gold.history);

    // Update Silver
    const silverPrice = prices.silver.current * weightMult;
    document.getElementById('silver-price-main').textContent = formatPrice(silverPrice);
    document.getElementById('silver-unit-main').textContent = weightUnitText;
    updateTrendElement('silver', prices.silver.history);

    // Update Copper
    const copperPrice = prices.copper.current * weightMult;
    document.getElementById('copper-price-main').textContent = formatPrice(copperPrice);
    document.getElementById('copper-unit-main').textContent = weightUnitText;
    updateTrendElement('copper', prices.copper.history);

    // Update Timestamp
    const date = new Date(state.data.timestamp);
    elements.timestamp.textContent = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    // Update active charts
    updateActiveCharts();

    // Check for alerts
    checkPriceAlerts();
}

function checkPriceAlerts() {
    if (!state.notificationsEnabled || !state.data) return;
    
    const timestamp = state.data.timestamp;
    const comm = 'gold';
    
    const current = state.data.prices[comm].current;
    const history = state.data.prices[comm].history;
    
    // Get the previous 7 days of history (excluding current if current is the latest)
    // We assume the last element of history is the current day's close.
    // If we have 30 days, we want the 7 days before the last element.
    const prev7Days = history.slice(-8, -1);
    if (prev7Days.length === 0) return;
    
    const weekLow = Math.min(...prev7Days);
    
    if (current < weekLow && state.notifiedTimestamps[comm] !== timestamp) {
        const purityMult = PURITY_MULTIPLIERS[state.goldPurity];
        const weightMult = state.weight === '10g' ? 10 : (state.weight === '1kg' ? 1000 : 1);
        const displayPrice = formatPrice(current * purityMult * weightMult);
        
        new Notification(`📉 GOLD Price Alert!`, {
            body: `Gold just dropped below the 7-day low! Now at ${displayPrice}.`,
        });
        state.notifiedTimestamps[comm] = timestamp;
    }
}

function updateTrendElement(commodity, history) {
    const trendEl = document.getElementById(`${commodity}-trend`);
    const trendIcon = trendEl.querySelector('.trend-icon');
    const trendValue = trendEl.querySelector('.trend-value');
    
    const change = calculateTrend(history);
    const isUp = change >= 0;
    
    trendEl.className = `trend ${isUp ? 'up' : 'down'}`;
    trendIcon.textContent = isUp ? '↑' : '↓';
    trendValue.textContent = `${Math.abs(change).toFixed(2)}%`;
}

// Initialize and Update Charts
function initChart(commodity, canvasId) {
    const ctx = document.getElementById(canvasId).getContext('2d');
    
    Chart.defaults.color = 'rgba(255, 255, 255, 0.8)';
    Chart.defaults.font.family = "'Inter', sans-serif";

    state.charts[commodity] = new Chart(ctx, {
        type: 'line',
        data: {
            labels: ['Day 1', 'Day 2', 'Day 3', 'Day 4', 'Day 5', 'Day 6', 'Today'],
            datasets: [{
                label: `Price (${state.currency})`,
                data: [],
                borderColor: '#ffffff',
                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                borderWidth: 2,
                fill: true,
                tension: 0.4,
                pointRadius: 4,
                pointHoverRadius: 6,
                pointBackgroundColor: '#ffffff'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    mode: 'index',
                    intersect: false,
                }
            },
            scales: {
                x: {
                    grid: { display: false, color: 'rgba(255, 255, 255, 0.1)' }
                },
                y: {
                    grid: { color: 'rgba(255, 255, 255, 0.1)' },
                    ticks: {
                        callback: function(value) {
                            return (state.currency === 'INR' ? '₹' : '$') + value;
                        }
                    }
                }
            }
        }
    });
}

function updateActiveCharts(specificCommodity = null) {
    if (!state.data) return;
    
    const commodities = specificCommodity ? [specificCommodity] : ['gold', 'silver', 'copper'];
    commodities.forEach(comm => {
        if (state.charts[comm]) {
            let fullHistory = [...state.data.prices[comm].history];
            let history1d = [...(state.data.prices[comm].history_1d || [])];
            
            let selectedTime = state.chartTimes[comm];
            let history = [];
            
            if (selectedTime === '30d') {
                history = fullHistory;
            } else if (selectedTime === '14d') {
                history = fullHistory.slice(-14);
            } else if (selectedTime === '7d') {
                history = fullHistory.slice(-7);
            } else if (selectedTime === '1d') {
                history = history1d.length ? history1d : fullHistory.slice(-2); // Fallback to 2 days if no intraday
            }
            
            // Apply purity multiplier for gold
            if (comm === 'gold') {
                const purityMult = PURITY_MULTIPLIERS[state.goldPurity];
                history = history.map(p => p * purityMult);
            }
            
            // Apply weight multiplier
            const weightMult = state.weight === '10g' ? 10 : (state.weight === '1kg' ? 1000 : 1);
            history = history.map(p => p * weightMult);
            
            // Apply currency conversion
            if (state.currency === 'INR') {
                history = history.map(p => p * USD_TO_INR);
            }
            
            state.charts[comm].data.labels = Array(history.length).fill(''); // Empty labels for clean look
            state.charts[comm].data.datasets[0].data = history;
            state.charts[comm].update();
        }
    });
}

// Custom Select Logic
function setupCustomSelects() {
    const customSelects = document.querySelectorAll('.custom-select');
    
    // Close all when clicking outside
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.custom-select')) {
            document.querySelectorAll('.select-items').forEach(el => el.classList.add('select-hide'));
        }
    });

    customSelects.forEach(sel => {
        const selected = sel.querySelector('.select-selected');
        const items = sel.querySelector('.select-items');
        const search = sel.querySelector('.select-search');
        const options = items.querySelectorAll('div:not(.search-container)');
        const stateKey = sel.dataset.id;

        selected.addEventListener('click', (e) => {
            // Close others
            document.querySelectorAll('.select-items').forEach(el => {
                if(el !== items) el.classList.add('select-hide');
            });
            items.classList.toggle('select-hide');
            if (search && !items.classList.contains('select-hide')) {
                search.focus();
                search.value = '';
                options.forEach(opt => opt.style.display = 'block');
            }
        });

        if (search) {
            search.addEventListener('input', (e) => {
                const val = e.target.value.toLowerCase();
                options.forEach(opt => {
                    if (opt.textContent.toLowerCase().includes(val)) {
                        opt.style.display = 'block';
                    } else {
                        opt.style.display = 'none';
                    }
                });
            });
            // Stop propagation on search click
            search.addEventListener('click', e => e.stopPropagation());
        }

        options.forEach(opt => {
            opt.addEventListener('click', async (e) => {
                const val = opt.dataset.value;
                selected.textContent = opt.textContent;
                
                // Update active class
                options.forEach(o => o.classList.remove('same-as-selected'));
                opt.classList.add('same-as-selected');
                
                items.classList.add('select-hide');
                
                // Update state
                state[stateKey] = val;
                
                if (stateKey === 'location') {
                    state.data = await fetchCommodityData();
                }
                updateUI();
                
                e.stopPropagation(); // Prevent card tap if inside card
            });
        });
    });
}

// Card Tap to expand chart
elements.cards.forEach(card => {
    card.addEventListener('click', (e) => {
        // Don't expand if clicking on the select dropdown or time buttons
        if (e.target.closest('.custom-select-wrapper') || e.target.classList.contains('time-btn')) return;

        const commodity = card.dataset.commodity;
        const chartContainer = document.getElementById(`${commodity}-chart-container`);
        const btn = card.querySelector('.expand-btn');
        const isActive = chartContainer.classList.contains('active');
        
        // Close all other charts
        document.querySelectorAll('.chart-container').forEach(c => {
            c.classList.remove('active');
        });
        document.querySelectorAll('.expand-btn').forEach(b => {
            b.textContent = 'Tap for Trend Options';
        });
        
        if (!isActive) {
            chartContainer.classList.add('active');
            btn.textContent = 'Hide Trend';
            
            // Initialize chart if it doesn't exist
            if (!state.charts[commodity]) {
                initChart(commodity, `${commodity}Chart`);
                updateActiveCharts(commodity);
            }
        }
    });
});

// Time Filter Buttons
document.querySelectorAll('.time-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
        const time = e.target.dataset.time;
        const container = e.target.closest('.chart-container');
        const commodityId = container.id; // e.g., gold-chart-container
        const commodity = commodityId.split('-')[0];
        
        // Update active class
        container.querySelectorAll('.time-btn').forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');
        
        // Update state and chart
        state.chartTimes[commodity] = time;
        updateActiveCharts(commodity);
    });
});

elements.notifyToggle.addEventListener('click', async () => {
    if (!state.notificationsEnabled) {
        let permission = Notification.permission;
        if (permission !== 'granted') {
            permission = await Notification.requestPermission();
        }
        
        if (permission === 'granted') {
            state.notificationsEnabled = true;
            document.getElementById('notify-toggle').style.color = '#10b981'; // Green active state
            checkPriceAlerts(); // Check immediately
        } else {
            alert("Notifications are disabled in your browser settings.");
        }
    } else {
        state.notificationsEnabled = false;
        document.getElementById('notify-toggle').style.color = '';
    }
});

elements.themeToggle.addEventListener('click', () => {
    state.isDarkTheme = !state.isDarkTheme;
    if (state.isDarkTheme) {
        document.body.classList.add('dark-theme');
        elements.themeIcon.innerHTML = '<circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>';
    } else {
        document.body.classList.remove('dark-theme');
        elements.themeIcon.innerHTML = '<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>';
    }
    
    // Update chart colors
    Object.values(state.charts).forEach(chart => {
        if (chart) {
            Chart.defaults.color = 'rgba(255, 255, 255, 0.8)';
            chart.data.datasets[0].borderColor = '#ffffff';
            chart.data.datasets[0].backgroundColor = 'rgba(255, 255, 255, 0.2)';
            chart.options.scales.x.grid.color = 'rgba(255, 255, 255, 0.1)';
            chart.options.scales.y.grid.color = 'rgba(255, 255, 255, 0.1)';
            chart.update();
        }
    });
});

// Initial Load
async function init() {
    setupCustomSelects();
    state.data = await fetchCommodityData();
    updateUI();
    
    // Periodically update mock data every 30 seconds
    setInterval(async () => {
        state.data = await fetchCommodityData();
        updateUI();
    }, 30000);
}

init();
