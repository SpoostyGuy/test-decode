var fetch = require('node-fetch-commonjs')
var crypto = require('crypto')
var fs = require('fs')
var padding = require('pkcs7-padding');
const { isTypedArray } = require('util/types');
var encKey = ""

function parseKey(hexString) {
    hexString = hexString.replace(/^0x/, '');
    var pairs = hexString.match(/[\dA-F]{2}/gi);
    var integers = pairs.map(function(s) {
        return parseInt(s, 16);
    });
    
    return Buffer.from(integers)
}

async function fetchKey(url) {
    console.log(url)
    var data = await fetch(url, {
        "headers": {
            "Host": "keyvdowallet.me",
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:136.0) Gecko/20100101 Firefox/136.0",
            "Accept": "*/*",
            "Accept-Language": "en-US,en;q=0.5",
            "Accept-Encoding": "gzip, deflate, br, zstd",
            "Referer": "https://reliabletv.me/",
            "Origin": "https://reliabletv.me",
            "Sec-Fetch-Dest": "empty",
            "Sec-Fetch-Mode": "cors",
            "Sec-Fetch-Site": "cross-site",
        },
        compress: true,
        "method": "GET",
    })
        .then(async res => {
            console.log(res.headers)
            return res.buffer()
        })
    return data
}

async function fetchAndDecryptFrame(link, key, iv) {
    var data = await fetch(link, {
        "headers": {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:135.0) Gecko/20100101 Firefox/135.0",
            "Accept": "*/*",
            "Accept-Language": "en-US,en;q=0.5",
            "Referer": "https://reliabletv.me/",
            "Origin": "https://reliabletv.me",
            "Sec-Fetch-Dest": "empty",
            "Sec-Fetch-Mode": "cors",
            "Sec-Fetch-Site": "cross-site",
        },
        "method": "GET",
        "mode": "cors"
    })
        .then(res => res.buffer())
    console.log(data.length)
    
    const decipher = crypto.createDecipheriv('aes-128-cbc', key, iv);
    decipher.setAutoPadding(true)
    let decrypted = decipher.update(data, '', 'hex') + decipher.final('hex')

    var newArray = []

    fs.writeFileSync('./test.ts', Buffer.from(decrypted, 'hex'))
    return decrypted;
}

async function listAll() {
    var totalGames = await fetch("https://dudestream.com/category/nba/", {
        "headers": {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:135.0) Gecko/20100101 Firefox/135.0",
            "Accept": "*/*",
            "Accept-Language": "en-US,en;q=0.5",
            "Referer": "https://reliabletv.me/",
            "Origin": "https://reliabletv.me",
            "Sec-Fetch-Dest": "empty",
            "Sec-Fetch-Mode": "cors",
            "Sec-Fetch-Site": "cross-site",
        },
        "method": "GET",
        "mode": "cors"
    })
        .then(res => res.text())

    var gamesList = []
    totalGames.split('<div class="mg-sec-top-post py-3 col">').forEach(function(dat, index) {
        if (index > 0) {
            gamesList.push({
                link: dat.split('<h4 class="entry-title title"><a href="')[1].split('">')[0],
                title: dat.split('<h4 class="entry-title title"><a href="')[1].split('">')[1].split('</a>')[0]
            })
        }
    })
    return gamesList
}

async function fetchBaseLinkDetails(gameData) {
    var gameLink = await fetch(gameData.link, {
        "headers": {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:135.0) Gecko/20100101 Firefox/135.0",
            "Accept": "*/*",
            "Accept-Language": "en-US,en;q=0.5",
            "Referer": "https://reliabletv.me/",
            "Origin": "https://reliabletv.me",
            "Sec-Fetch-Dest": "empty",
            "Sec-Fetch-Mode": "cors",
            "Sec-Fetch-Site": "cross-site",
        },
        "method": "GET",
        "mode": "cors"
    })
        .then(res => res.text())
        .then(res => res.split("<iframe src='")[1].split("'")[0])

    var exists = true
    var frameData = await fetch(gameLink, {
        "headers": {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:135.0) Gecko/20100101 Firefox/135.0",
            "Accept": "*/*",
            "Accept-Language": "en-US,en;q=0.5",
            "Referer": "https://reliabletv.me/",
            "Origin": "https://reliabletv.me",
            "Sec-Fetch-Dest": "empty",
            "Sec-Fetch-Mode": "cors",
            "Sec-Fetch-Site": "cross-site",
        },
        "method": "GET",
        "mode": "cors"
    })
        .then(res => res.text())
        .then(res => {
            return "https://reliabletv.me/sd0embed/Basketball?v=" + encodeURIComponent(res.split('const zmid = "')[1].split('"')[0])
        })
        .catch(err => {
            exists = false
        })
    if (exists == false) {
        return false
    }
    
    var finalLink = ""
    var finalResponse = await fetch(frameData, {
        "headers": {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:135.0) Gecko/20100101 Firefox/135.0",
            "Accept": "*/*",
            "Accept-Language": "en-US,en;q=0.5",
            "Referer": "https://embedsports.me",
            "Origin": "https://embedsports.me/",
            "Sec-Fetch-Dest": "empty",
            "Sec-Fetch-Mode": "cors",
            "Sec-Fetch-Site": "cross-site",
        },
        "method": "GET",
        "mode": "cors"
    })
        .then(res => res.text())
        .then(res => {
            finalLink = Buffer.from(
                Buffer.from(
                    res.split("const videoUrl = '")[1].split('"')[0],
                    'base64'
                ).toString(),
                'base64',
            ).toString()
            return res
        })
    

    
    await fetch(Buffer.from(finalResponse.split("const secTokenUrl = '")[1].split("'")[0], 'base64').toString() + "/?scode=" + finalResponse.split("const sCode = '")[1].split("'")[0] + "&stream=" + finalResponse.split("const strUnqId = '")[1].split("'")[0] + "&expires=" + finalResponse.split("const expireTs = ")[1].split(';')[0], {
        "headers": {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:135.0) Gecko/20100101 Firefox/135.0",
            "Accept": "*/*",
            "Accept-Language": "en-US,en;q=0.5",
            "Referer": "https://reliabletv.me/",
            "Origin": "https://reliabletv.me",
            "Sec-Fetch-Dest": "empty",
            "Sec-Fetch-Mode": "cors",
            "Sec-Fetch-Site": "cross-site",
            "Connection": "keep-alive",
        },
        "redirect": 'manual',
        "method": "GET",
        "mode": "cors"
    })
        .then(async res => {
            //console.log(await res.text())
        })

    var responseM3U8 = await fetch(finalLink, {
        "headers": {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:135.0) Gecko/20100101 Firefox/135.0",
            "Accept": "*/*",
            "Accept-Language": "en-US,en;q=0.5",
            "Referer": "https://reliabletv.me/",
            "Origin": "https://reliabletv.me",
            "Sec-Fetch-Dest": "empty",
            "Sec-Fetch-Mode": "cors",
            "Sec-Fetch-Site": "cross-site",
            "Connection": "keep-alive",
        },
        "redirect": 'manual',
        "method": "GET",
        "mode": "cors"
    })
        .then(res => {
            return finalLink.split('/').slice(0,3).join('/') + res.headers.get('location')
        })
    
    return responseM3U8
}

async function run() {
    var totalList = await listAll()
    console.log('Fetching link...')
    var baseLink = undefined
    for (var index in totalList) {
        var value = totalList[index]
        console.log(value)
        baseLink = await fetchBaseLinkDetails(value)
        console.log(baseLink)
        if (baseLink != false) {
            break
        } else {
            console.log(value.title + " isn't on")
        }
    }

    console.log("Fetching frame...")
    var data = await fetch(baseLink, {
        "headers": {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:136.0) Gecko/20100101 Firefox/136.0",
            "Accept": "*/*",
            "Accept-Language": "en-US,en;q=0.5",
            "Accept-Encoding": "gzip, deflate, br, zstd",
            "Referer": "https://reliabletv.me/",
            "Origin": "https://reliabletv.me",
            "Sec-Fetch-Dest": "empty",
            "Sec-Fetch-Mode": "cors",
            "Sec-Fetch-Site": "cross-site",
        },
        "method": "GET",
        "mode": "cors"
    })
        .then(res => res.text())

    console.log(data)
    var downloadLink = baseLink.split("/chunklist.m3u8")[0] + '/' + data.split("#EXTINF:3.0,\n")[1].split('\n')[0]
    //console.log(downloadLink)
    var key = await fetchKey(data.split(`AES-128,URI="`)[1].split('"')[0])
    var ivKey = Buffer.from(data.split("IV=")[1].split(',')[0].split('0x')[1], 'hex')
    //console.log(ivKey)
    //console.log(key)
    //console.log(encKey)
    await fetchAndDecryptFrame(downloadLink, key, ivKey)
}

run()
