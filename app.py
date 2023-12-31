import yfinance as yf
import json
from flask import request, render_template, Flask, jsonify

app = Flask(__name__, template_folder='templates')

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/data')
def data():
    with open('data.json', 'r') as json_file:
        data = json.load(json_file)
    return jsonify(data)

@app.route('/get-stock-data', methods=['POST'])
def getStockData():
    ticker = request.get_json()['ticker']
    data = yf.Ticker(ticker).history(period='1y')
    return(jsonify({
        'currentPrice': data.iloc[-1].Close,
        'openingPrice': data.iloc[-1].Open
    }))

if __name__ == '__main__':
    app.run(debug=True)

