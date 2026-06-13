# 📈 price tracker

A modern, responsive web application for tracking live commodity prices (Gold, Silver, and Copper) with localized metrics, interactive charts, and browser alerts.

## 🌟 Features

- **Real-Time Data**: Fetches live market data using Yahoo Finance via a Python Flask backend.
- **Interactive Charts**: Visualizes historical price trends with selectable timeframes (1D, 7D, 2W, 30D) using Chart.js.
- **Smart Filtering**:
  - **Location**: Calculates regional price variations for cities like Kolkata, Mumbai, New York, Dubai, etc.
  - **Currency**: Instantly toggle between ₹ INR and $ USD.
  - **Weight & Purity**: Dynamically calculates prices based on weight (1g, 10g, 1kg) and Gold purity (24K, 22K, 20K, 18K).
- **Price Drop Alerts**: Automatically triggers a browser notification when Gold hits a 7-day low.
- **Beautiful UI**: Features a clean, minimalist design with a glassmorphism header, responsive pill-shaped dropdowns, and a seamless Dark/Light mode toggle.

## 🛠️ Tech Stack

- **Frontend**: Vanilla HTML5, CSS3, JavaScript (ES6+), Chart.js
- **Backend**: Python, Flask, `yfinance` (for market data)

## 🚀 Getting Started

### Prerequisites
- Python 3.x
- pip (Python package manager)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/ItzTitas/pricetracker.git
   cd pricetracker
   ```

2. Install backend dependencies:
   ```bash
   pip install -r requirements.txt
   ```

3. Run the Flask backend server:
   ```bash
   python server.py
   ```

4. Open the application:
   - Simply open `index.html` in your favorite web browser, or serve it using a local development server.

## 📱 Mobile Responsive
The interface is fully optimized for mobile devices, featuring swipeable filter bars and touch-friendly interactive charts.
