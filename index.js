const puppeteer = require('puppeteer')
const glob = require('glob')
const fs = require('fs')
const moment = require('moment')

const getLocations = () => {
    return new Promise((resolve, reject) => {
        glob('locations/*.json', function (err, files) {
            if (err) {
                reject(err)
            }
            else {
                resolve(files)
            }
        })
    })
}

const capture = (lat, lon, zoom, output) => {
    return new Promise(async (resolve, reject) => {
        const URL = `https://www.google.com/maps/@?api=1&map_action=map&center=${lat},${lon}&zoom=${zoom}&layer=traffic`
        const browser = await puppeteer.launch()
        const page = await browser.newPage()

        await page.goto(URL)
        await page.screenshot({ path: output })
        await browser.close()
    })
}

const normalizeName = name => {
    return name.toLowerCase().replace(' ', '_').replace(/[^a-z-_]/, '')
}

const parseCityName = fileName => {
    return fileName.replace('locations/', '').replace('.json', '')
}

getLocations()
    .then(async (locations) => {
        var promises = []
        locations.forEach(location => {
            var contents = fs.readFileSync(location);
            var jsonContent = JSON.parse(contents);

            const city = parseCityName(location)
            if (! fs.existsSync(`data/${city}`)) {
                fs.mkdirSync(`data/${city}`)
            }

            Object.keys(jsonContent).forEach(key => {
                const lat = jsonContent[key].lat
                const lon = jsonContent[key].lon
                const zoom = (jsonContent[key].zoom) ? jsonContent[key].zoom : 18
                const output = `data/${city}/${normalizeName(key)}_${moment().format('YYYY-MM-DD_HH:mm')}.png`
                promises.push(capture(lat, lon, zoom, output))
            })
        })
        await Promise.all(promises)
    })