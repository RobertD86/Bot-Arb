const axios = require('axios')
const querystring = require('querystring')
const crypto = require('crypto')

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