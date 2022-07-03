const axios = require('axios')
const QUOTE = process.argv[2]
const AMOUNT = process.argv[3]
const PROFITABILITY = 1.000

const { Telegraf } = require('telegraf')
const bot = new Telegraf("5565586570:AAH_bA8rRJIYSyrIou3klsiGrGV08jndxuo")

const api = require('./api')

const WebSocket = require('ws')
const { PassThrough } = require('stream')
const ws = new WebSocket("wss://stream.binance.com:9443/ws/!bookTicker")

const BOOK = {}

ws.onmessage = async(event) => {
    const obj = JSON.parse(event.data)
    BOOK[obg.s] = {ask: parseFloat(obj.a), bid: parseFloat(obj.b)}
}

async function exchangeInfo(){
    const response = await axios.get("https://testnet.binance.vision/api/v3/exchangeInfo")
    const symbols = response.data.symbols.filter(s => s.status === 'TRADING')
    return symbols.map(s => {
        return {
            symbol: s.symbol,
            base: s.baseAsset,
            quote: s.quoteAsset

        }
    })
}

function getBuyBuySell(buySymbols, allSymbols){
    const buyBuySell = []

    for(let i = 0; i < buySymbols.length; i++){
        const buy1 = buySymbols[i]

        const right = allSymbols.filter(s => s.quote === buy1.base)

        for(let j = 0; j < right.length; j++){
            const buy2 = right[j]

            const sell1 = allSymbols.find(s => s.base === buy2.base && s.quote === buy1.quote)
            if(!sell1) continue

            buyBuySell.push({buy1, buy2, sell1})
        }
    }
    return buyBuySell
}