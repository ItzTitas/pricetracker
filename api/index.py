import yfinance as yf
from flask import Flask, jsonify
from flask_cors import CORS
from datetime import datetime

app = Flask(__name__)
CORS(app)

TROY_OUNCE_TO_GRAM = 31.1034768
POUND_TO_GRAM = 453.592

def get_historical_data(ticker, period="40d", interval="1d"):
    t = yf.Ticker(ticker)
    df = t.history(period=period, interval=interval)
    if df.empty:
        return []
    prices = df['Close'].dropna().tolist()
    return prices

@app.route('/api/commodities', methods=['GET'])
def get_commodities():
    try:
        # Fetch data
        gold_raw = get_historical_data("GC=F", "40d", "1d")[-30:]
        gold_raw_1d = get_historical_data("GC=F", "1d", "15m")
        silver_raw = get_historical_data("SI=F", "40d", "1d")[-30:]
        silver_raw_1d = get_historical_data("SI=F", "1d", "15m")
        copper_raw = get_historical_data("HG=F", "40d", "1d")[-30:]
        copper_raw_1d = get_historical_data("HG=F", "1d", "15m")
        usd_inr_raw = get_historical_data("INR=X", "40d", "1d")[-30:]
        
        # Current exchange rate
        exchange_rate = usd_inr_raw[-1] if usd_inr_raw else 83.5
        
        # Convert prices to USD per gram
        def convert(arr, divisor): return [float(p / divisor) for p in arr]

        gold_history = convert(gold_raw, TROY_OUNCE_TO_GRAM)
        gold_history_1d = convert(gold_raw_1d, TROY_OUNCE_TO_GRAM)
        
        silver_history = convert(silver_raw, TROY_OUNCE_TO_GRAM)
        silver_history_1d = convert(silver_raw_1d, TROY_OUNCE_TO_GRAM)
        
        copper_history = convert(copper_raw, POUND_TO_GRAM)
        copper_history_1d = convert(copper_raw_1d, POUND_TO_GRAM)
        
        return jsonify({
            "timestamp": datetime.now().isoformat(),
            "exchange_rate": float(exchange_rate),
            "prices": {
                "gold": {
                    "current": gold_history[-1] if gold_history else 0,
                    "history": gold_history,
                    "history_1d": gold_history_1d
                },
                "silver": {
                    "current": silver_history[-1] if silver_history else 0,
                    "history": silver_history,
                    "history_1d": silver_history_1d
                },
                "copper": {
                    "current": copper_history[-1] if copper_history else 0,
                    "history": copper_history,
                    "history_1d": copper_history_1d
                }
            }
        })
    except Exception as e:
        print("Error fetching data:", e)
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    print("Starting Commodity Price API Server...")
    print("API Endpoint: http://127.0.0.1:5000/api/commodities")
    app.run(port=5000, host="0.0.0.0")
