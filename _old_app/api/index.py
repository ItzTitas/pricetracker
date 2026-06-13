import os
from flask import Flask, jsonify
from flask_cors import CORS
from datetime import datetime
import requests

app = Flask(__name__)
CORS(app)

TROY_OUNCE_TO_GRAM = 31.1034768
POUND_TO_GRAM = 453.592

USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"

def fetch_yahoo_data(ticker, period="40d", interval="1d"):
    url = f"https://query1.finance.yahoo.com/v8/finance/chart/{ticker}?range={period}&interval={interval}"
    headers = {"User-Agent": USER_AGENT}
    try:
        res = requests.get(url, headers=headers, timeout=5)
        res.raise_for_status()
        data = res.json()
        result = data.get("chart", {}).get("result", [])
        if not result:
            return []
        quote = result[0].get("indicators", {}).get("quote", [])
        if not quote:
            return []
        
        # 'close' array contains the closing prices, which may have some null values
        closes = quote[0].get("close", [])
        # Filter out None values
        valid_closes = [c for c in closes if c is not None]
        return valid_closes
    except Exception as e:
        print(f"Error fetching {ticker}: {e}")
        return []

@app.route('/api/commodities', methods=['GET'])
def get_commodities():
    try:
        # Fetch data directly from Yahoo JSON API
        gold_raw = fetch_yahoo_data("GC=F", "40d", "1d")[-30:]
        gold_raw_1d = fetch_yahoo_data("GC=F", "1d", "15m")
        
        silver_raw = fetch_yahoo_data("SI=F", "40d", "1d")[-30:]
        silver_raw_1d = fetch_yahoo_data("SI=F", "1d", "15m")
        
        copper_raw = fetch_yahoo_data("HG=F", "40d", "1d")[-30:]
        copper_raw_1d = fetch_yahoo_data("HG=F", "1d", "15m")
        
        usd_inr_raw = fetch_yahoo_data("INR=X", "40d", "1d")[-30:]
        exchange_rate = usd_inr_raw[-1] if usd_inr_raw else 83.5
        
        # Helper to convert array
        def convert(arr, divisor):
            return [float(p / divisor) for p in arr] if arr else []

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
        import traceback
        return jsonify({"error": "Runtime Error", "details": str(e), "trace": traceback.format_exc()}), 500

if __name__ == '__main__':
    app.run(port=5000, host="0.0.0.0")
