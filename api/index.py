import yfinance as yf
from flask import Flask, jsonify
from flask_cors import CORS
from datetime import datetime

app = Flask(__name__)
CORS(app)

TROY_OUNCE_TO_GRAM = 31.1034768
POUND_TO_GRAM = 453.592

@app.route('/api/commodities', methods=['GET'])
def get_commodities():
    try:
        # Tickers for commodities and exchange rate
        tickers = ["GC=F", "SI=F", "HG=F", "INR=X"]
        
        # Download historical data in one batch to stay within Vercel's timeout
        # We fetch 40d to ensure we have enough data points
        data_30d = yf.download(tickers, period="40d", interval="1d", group_by='ticker', progress=False)
        
        # Download intraday data in one batch
        data_1d = yf.download(tickers, period="1d", interval="15m", group_by='ticker', progress=False)
        
        def get_series(df, ticker):
            try:
                if df.empty:
                    return []
                # Use group_by='ticker' format: df[ticker]['Close']
                return df[ticker]['Close'].dropna().tolist()
            except:
                return []

        gold_raw = get_series(data_30d, "GC=F")[-30:]
        gold_raw_1d = get_series(data_1d, "GC=F")
        
        silver_raw = get_series(data_30d, "SI=F")[-30:]
        silver_raw_1d = get_series(data_1d, "SI=F")
        
        copper_raw = get_series(data_30d, "HG=F")[-30:]
        copper_raw_1d = get_series(data_1d, "HG=F")
        
        usd_inr_raw = get_series(data_30d, "INR=X")
        
        # Current exchange rate
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
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(port=5000, host="0.0.0.0")
