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