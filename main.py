from flask import Flask, render_template, jsonify, request
from binance.client import Client
import pandas as pd
from ta import trend, momentum, volatility

app = Flask(__name__)

API_KEY = "ym3KaJ60R8YwrlnIPtwtMl5ZgajyViZfvPcAEgyDOWvafsCcd4gjnH76NCaX8m6n"  
API_SECRET = "FXdHWJFpF8D57QDutLREwEjkW7BVdAbUSQ7I2IHVEtNchuiwJQXjKhSArsJL12pG" 
client = Client(API_KEY, API_SECRET)

def get_technical_indicators(data):
    """
    Tính toán các chỉ báo kỹ thuật và thêm vào DataFrame.
    """
    data['SMA10'] = trend.sma_indicator(data['close'], window=10)
    data['SMA50'] = trend.sma_indicator(data['close'], window=50)
    data['RSI'] = momentum.rsi(data['close'], window=14)
    data['MACD'] = trend.macd(data['close'])
    data['upper_band'], data['lower_band'] = volatility.bollinger_hband(data['close'], window=20), volatility.bollinger_lband(data['close'], window=20)
    data['ATR'] = volatility.average_true_range(data['high'], data['low'], data['close'], window=14)
    return data

def analyze_coin(symbol):
    """
    Phân tích kỹ thuật cho một đồng coin và trả về kết quả dưới dạng JSON.
    """
    try:
        klines = client.futures_klines(symbol=symbol, interval=Client.KLINE_INTERVAL_1DAY, limit=100)
        
        df = pd.DataFrame(klines, columns=["timestamp", "open", "high", "low", "close", "volume", "close_time", "quote_asset_volume", "number_of_trades", "taker_buy_base_asset_volume", "taker_buy_quote_asset_volume", "ignore"])
        
        df['timestamp'] = pd.to_datetime(df['timestamp'], unit='ms')
        df['close'] = pd.to_numeric(df['close'])
        df['high'] = pd.to_numeric(df['high'])
        df['low'] = pd.to_numeric(df['low'])

        df = get_technical_indicators(df)

        latest_data = df.iloc[-1]

        signal = "Nên Long" if latest_data['RSI'] < 30 and latest_data['SMA10'] > latest_data['SMA50'] else "Nên Short"
        
        atr = latest_data['ATR']
        if signal == "Nên Long":
            predicted_price = latest_data['close'] + atr * 2  
            predicted_price_label = "Giá có thể lên đến"
        else:
            predicted_price = latest_data['close'] - atr * 2  
            predicted_price_label = "Giá có thể xuống đến"
        
        volatility = "Biến động rất lớn" if atr > 3 else "Biến động bình thường" if atr < 1 else "Biến động nhỏ"

        trend_direction = "Tăng" if latest_data['SMA10'] > latest_data['SMA50'] else "Giảm"

        final_conclusion = signal

        result = {
            "symbol": symbol,
            "signal": signal,
            "predicted_price": predicted_price,
            "predicted_price_label": predicted_price_label,
            "volatility": volatility,
            "trend_direction": trend_direction,
            "final_conclusion": final_conclusion
        }

        return result
    except Exception as e:
        return {"error": str(e)}

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/coins')
def get_coins():
    """
    Trả về danh sách các đồng coin khả dụng từ API.
    """
    exchange_info = client.futures_exchange_info()
    symbols = [item['symbol'] for item in exchange_info['symbols'] if item['contractType'] == 'PERPETUAL']
    return jsonify(symbols)

@app.route('/analyze', methods=['POST'])
def analyze():
    """
    Phân tích tất cả các đồng coin đã chọn.
    """
    selected_coins = request.json.get('coins', [])
    results = []

    for symbol in selected_coins:
        result = analyze_coin(symbol)
        results.append(result)

    return jsonify(results)

if __name__ == '__main__':
    app.run(debug=True, host="0.0.0.0", port=3000)
