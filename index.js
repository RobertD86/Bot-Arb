const axios = require('axios')
const QUOTE = 'USDT'
const AMOUNT = 20
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
    BOOK[obj.s] = {ask: parseFloat(obj.a), bid: parseFloat(obj.b)}
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

    for(let i=0; i < buySymbols.length; i++){
        const buy1 = buySymbols[i]

        const right = allSymbols.filter(s => s.quote === buy1.base)

        for(let j=0; j < right.length; j++){
            const buy2 = right[j]

            const sell1 = allSymbols.find(s => s.base === buy2.base && s.quote === buy1.quote)
            if(!sell1) continue

            buyBuySell.push({buy1, buy2, sell1})
        }
    }
    return buyBuySell

}

function getBuySellSell(buySymbols, allSymbols){
    const buySellSell = []

    for(let i=0; i < buySymbols.length; i++){
        const buy1 = buySymbols[i]

        const right = allSymbols.filter(s => s.base === buy1.base && s.quote !== buy1.quote)

        for(let j=0; j < right.length; j++){
            const sell1 = right[j]

            const sell2 = allSymbols.find(s => s.base === sell1.quote && s.quote === buy1.quote)
            if(!sell2) continue

            buySellSell.push({buy1, sell1, sell2})
        }
    }
    return buySellSell

}

async function processBuyBuySell(buyBuySell){
    for(let i =0; i < buyBuySell.length; i++){
        const candidate = buyBuySell[i]

        let priceBuy1 = BOOK[candidate.buy1.symbol]
        if(!priceBuy1) continue
        priceBuy1 = priceBuy1.ask

        let priceBuy2 = BOOK[candidate.buy2.symbol]
        if(!priceBuy2) continue
        priceBuy2 = priceBuy2.ask

        let priceSell1 = BOOK[candidate.sell1.symbol]
        if(!priceSell1) continue
        priceSell1 = priceSell1.bid

        const crossRate = (1/priceBuy1) * (1/priceBuy2) * priceSell1

        if(crossRate > PROFITABILITY){
            console.log(`Oportunidade em BBS ${candidate.buy1.symbol} ==> ${candidate.buy2.symbol} ==> ${candidate.sell1.symbol}`)

            const account = await api.accountInfo()
            const coins = account.balances.filter(b => (b.asset) !== -1)

            if(AMOUNT <= parseFloat(coins.find(c => c.asset === QUOTE).free)){

                const buyOrder = await api.newOrderBuy(candidate.buy1.symbol,(AMOUNT/priceBuy1).toFixed(5))
                console.log(`Order: ${buyOrder.orderId}`)
                console.log(`Satus: ${buyOrder.status}`)
                console.log(`Qty: ${buyOrder.origQty}`)

                if(buyOrder.status === 'FILLED'){
                    const buyOrder2 = await api.newOrderBuy(candidate.buy2.symbol, (buyOrder.origQty/priceBuy2).toFixed(5))
                    console.log(`Order: ${buyOrder2.orderId}`)
                    console.log(`Satus: ${buyOrder2.status}`)
                    console.log(`Qty: ${buyOrder2.origQty}`)

                    if(buyOrder2.status === 'FILLED'){
                        const SellOrder = await api.newOrderSell(candidate.sell1.symbol, (buyOrder2.origQty))
                        console.log(`Order: ${SellOrder.orderId}`)
                        console.log(`Satus: ${SellOrder.status}`)
                        console.log(`Qty: ${SellOrder.cummulativeQuoteQty}`)
                    }
                }
            }
       }
    }
}

async function processBuySellSell(buySellsell){
    for(let i=0; i < buySellsell.length; i++){
        const candidate = buySellsell[i]

        let priceBuy1 = BOOK[candidate.buy1.symbol]
        if(!priceBuy1) continue
        priceBuy1 = priceBuy1.ask

        let priceSell1 = BOOK[candidate.sell1.symbol]
        if(!priceSell1) continue
        priceSell1 = priceSell1.bid

        let priceSell2 = BOOK[candidate.sell2.symbol]
        if(!priceSell2) continue
        priceSell2 = priceSell2.bid

        const crossRate = (1/priceBuy1) * priceSell1 * priceSell2

        if(crossRate > PROFITABILITY){
            console.log(`Oportunidade em BSS ${candidate.buy1.symbol} ==> ${candidate.sell1.symbol} ==> ${candidate.sell2.symbol}`)
        }

    }
}

async function process(){
    const allSymbols = await exchangeInfo()
    console.log('Existem ' + allSymbols.length + ' pares sendo negociados.')

    const buySymbols = allSymbols.filter(s => s.quote === QUOTE)

    const buyBuySell = getBuyBuySell(buySymbols, allSymbols)
    console.log('Existem ' + buyBuySell.length + ' pares BBS')

    const buySellSell = getBuySellSell(buySymbols, allSymbols)
    console.log('Existem ' + buySellSell.length + ' pares BSS')


    setInterval(async() =>{
        const account = await api.accountInfo()
        const coins = account.balances.filter(b => (b.asset) !== -1)
        console.clear()
        console.log("==================================================================");
        console.log('CARTEIRA');
        console.log(coins)
        console.log("==================================================================")
        processBuyBuySell(buyBuySell)
        //processBuySellSell(buySellSell)
    }, 5000)
}

process()

