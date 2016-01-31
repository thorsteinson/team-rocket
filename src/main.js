import * as request from 'request'
import {load} from 'cheerio'
import {Promise} from 'bluebird'
import {default as _} from 'lodash'
import * as fs from 'fs'

import {parsePokemon, toCSV, header} from './pokemon'

// Use bluebird in order to use libraries in a promise friendly way
Promise.promisifyAll(request, {multiArgs: true})

// Setup files
const CSV_OUT = process.env.CSV_OUT || 'pokemon.csv'
const wStream = fs.createWriteStream(CSV_OUT)
wStream.write(header() + '\n')

const BASE_SCRAPE_URL = 'http://pokemondb.net/pokedex/national'
const BASE_URI = 'http://pokemondb.net'

// Get all the links on the root page
const requests = request.getAsync(BASE_SCRAPE_URL)
  .then(([code, body]) => {
    const $ = load(body)

    // List of all the pokemons is contained in this div
    const pokeContainer = $('.infocard-tall-list')
    // Gets links to each pokemon page, and the generation / name
    return _
      .chain(pokeContainer.find('.infocard-tall').toArray())
      .map(elem => {
        const tmp = $(elem)
        const pokemon = tmp.find('a.ent-name')
        const obj = {
          name: pokemon.text(),
          href: BASE_URI + pokemon.attr('href'),
          generation: getGeneration(tmp.find('small').first().text().substring(1))
        }
        return obj
      })
      // Only go up to gen 5, since data is incomplete for 6 at the moment
      .filter(pokemon => pokemon.generation <= 5)
      .map(pokemon => {
        return function () {
          return fetchPokemon(pokemon)
        }
      })
      .value()
  })

// Given an ID, give back the generation
function getGeneration (id) {
  if (id <= 151) return 1
  else if (id <= 251) return 2
  else if (id <= 386) return 3
  else if (id <= 493) return 4
  else if (id <= 649) return 5
  else return 6
}

// Returns a promise that resolves a pokemon object
function fetchPokemon ({name, href, generation}) {
  return request.getAsync(href)
    .then(([code, body]) => {
      // Use cheerio to parse the web page
      const $ = load(body)

      const pokedex = $("h2:contains('data')").next().find('td')
      const idNum = getIdx(pokedex, 0)
      const type = getIdx(pokedex, 1)
      const species = getIdx(pokedex, 2)
      const height = getIdx(pokedex, 3)
      const weight = getIdx(pokedex, 4)

      const training = $("h2:contains('Training')").next().find('td')
      const ev = getIdx(training, 0)
      const catchRate = getIdx(training, 1)
      const baseHappiness = getIdx(training, 2)
      const baseExp = getIdx(training, 3)
      const growthRate = getIdx(training, 4)

      const breeding = $("h2:contains('Breeding')").next().find('td')
      const gender = getIdx(breeding, 1)
      const eggCycles = getIdx(breeding, 2)

      const stats = $("h2:contains('stats')").next()
      const hp = getStat('HP')
      const attack = getStat('Attack')
      const defense = getStat('Defense')
      const speed = stats.getStat('Speed')
      const specialAttack = getStat('Sp. Atk')
      const specialDefense = getStat('Sp. Def')
      const total = getStat('Total')

      function getIdx (section, idx) {
        return $(section.get(idx)).text()
      }

      function getStat (stat) {
        return stats.find(`th:contains('${stat}')`).next().first.text()
      }

      return parsePokemon({
        id: idNum,
        species,
        type,
        height,
        weight,
        ev,
        catchRate,
        baseExp,
        growthRate,
        eggCycles,
        baseHappiness,
        gender,
        hp,
        attack,
        specialAttack,
        defense,
        specialDefense,
        speed,
        total,
        name,
        generation
      })
    })
}

// SERIALLY fetches each pokemon, with a 500ms delay inbetween each request
Promise.mapSeries(requests, promise => {
  const req = promise()
    .then(p => {
      // Logs out pokemon
      console.log(toCSV(p))
      wStream.write(toCSV(p) + '\n')
    })
  return Promise.delay(500).then(req)
}).then(() => wStream.end())
  .catch(err => {
    console.log('Encountered Error: ')
    console.log(err)
    wStream.end()
    throw err
  })
