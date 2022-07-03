const axios = require('axios')
const querystring = require('querystring')
const crypto = require('crypto')
const { isTypedArray } = require('util/types')

const apiKey = process.env.API_KEY
const apiSecret = process.env.SECRET_KEY
const apiUrl = process.env.API_URL

async function privateCall(path, data={}, method='GET'){
    const timestamp = Date.now()
    const signature = crypto.createHmac('sha256', apiSecret)
        .update(`${querystring.stringify({...data, timestamp })}`)
        .digest('hex')
    
    const newData = {...data, timestamp, signature}
    const qs = `?${querystring.stringify(newData)}`   
    
    try{
        const result = await axios({
            method,
            url: `${apiUrl}${path}${qs}`,
            headers: { 'X-MBX-APIKEY': apiKey }
        })
        return result.data

    }catch(err){
        console.log(err)
    }
}

async function newOrderBuy(symbol, quantity, price, side = 'BUY', type = 'MARKET'){
    const data = {symbol, quantity, side, type}

    if(price) data.price = price
    if(type === 'LIMIT') data.timeInForece = 'GTC'

    return privateCall('/v3/order', data, 'POST')
}

async function newOrderSell(symbol, quantity, price, side = 'SELL', type = 'MARKET'){
    const data  = {symbol, quantity, side, type}

    if(price) data.price = price
    if(type === 'LIMIT') data.timeInForece = 'GTC'

    return privateCall('/v3/order', data, 'POST')
}

async function accountInfo(){
    return privateCall('/v3/account')
}

async function publicCall(path, data, method= 'GET'){
    try{
        const qs = data ? `?${querystring.stringify(data)}` : ''
        const result = await axios({
            method,
            url: `${apiUrl}${path}${qs}`
        })
        return result.data

    }catch(err){
        console.log(err)
    }

}

async function time(){
    return publicCall('/v3/time')
}

async function depth(symbol = 'BTCBUSD', limit= 5){
    return publicCall('/v3/depth',{symbol, limit})
}

async function exchangeInfo(){
    return publicCall('/v3/exchangeInfo')
}

module.exports = { time, depth, exchangeInfo, accountInfo, newOrderBuy, newOrderSell}