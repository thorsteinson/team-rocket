import * as request from 'request'
import {load} from 'cheerio'
import * as csv from 'csv'
import {Promise} from 'bluebird'

// Use bluebird in order to use libraries in a promise friendly way
Promise.promisifyAll(csv)
Promise.promisifyAll(request, {multiArgs: true})

// const BASE_SCRAPE_URL = 'http://pokemondb.net/pokedex/national'

// Idea: Create an array of promises that are serially executed with delays between each
// Each request gets parsed into data

// Real example of a page, just for testing purposes
const BULBASAUR = 'http://pokemondb.net/pokedex/bulbasaur'

request.getAsync(BULBASAUR)
  .then(([code, body]) => {
    // Use cheerio to parse the web page
    const $ = load(body)

    const pokedex = $("h2:contains('data')").next().find('td')
    const idNum = $(pokedex.get(0)).text()
    const type = $(pokedex.get(1)).text()
    const species = $(pokedex.get(2)).text()
    const height = $(pokedex.get(3)).text()
    const weight = $(pokedex.get(4)).text()

    const training = $("h2:contains('Training')").next().find('td')
    const evYield = $(training.get(0)).text()
    const catchRate = $(training.get(1)).text()
    const baseHappiness = $(training.get(2)).text()
    const baseExp = $(training.get(3)).text()
    const growthRate = $(training.get(4)).text()

    const breeding = $("h2:contains('Breeding')").next().find('td')
    const gender = $(breeding.get(1)).text()
    const eggCycles = $(breeding.get(2)).text()

    const stats = $("h2:contains('stats')").next()
    const hp = stats.find("th:contains('HP')").next().text()
    const attack = stats.find("th:contains('Attack')").next().text()
    const defense = stats.find("th:contains('Defense')").next().text()
    const speed = stats.find("th:contains('Speed')").next().text()
    const specialAttack = stats.find("th:contains('Sp. Atk')").next().text()
    const specialDefense = stats.find("th:contains('Sp. Def')").next().text()
    const total = stats.find("th:contains('Total')").next().text()

    const data = [
      `ID Num: ${idNum}`,
      `Species: ${species}`,
      `Type: ${type}`,
      `Height: ${height}`,
      `Weight: ${weight}`,
      `EV Yield: ${evYield}`,
      `Catch Rate: ${catchRate}`,
      `Base Exp: ${baseExp}`,
      `Growth Rate: ${growthRate}`,
      `Egg Cycles: ${eggCycles}`,
      `Happiness: ${baseHappiness}`,
      `Gender: ${gender}`,
      `HP: ${hp}`,
      `Attack: ${attack}`,
      `Special Attack: ${specialAttack}`,
      `Defense: ${defense}`,
      `Special Defense: ${specialDefense}`,
      `Speed: ${speed}`,
      `Stat Total: ${total}`
    ].join('\n')

    console.log(data)
  })
