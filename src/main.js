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
wStream.write(header())

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
          generation: getGeneration(pokemon.find('small').first().text().substring(1))
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
      const idNum = $(pokedex.get(0)).text()
      const type = $(pokedex.get(1)).text()
      const species = $(pokedex.get(2)).text()
      const height = $(pokedex.get(3)).text()
      const weight = $(pokedex.get(4)).text()

      const training = $("h2:contains('Training')").next().find('td')
      const ev = $(training.get(0)).text()
      const catchRate = $(training.get(1)).text()
      const baseHappiness = $(training.get(2)).text()
      const baseExp = $(training.get(3)).text()
      const growthRate = $(training.get(4)).text()

      const breeding = $("h2:contains('Breeding')").next().find('td')
      const gender = $(breeding.get(1)).text()
      const eggCycles = $(breeding.get(2)).text()

      const stats = $("h2:contains('stats')").next()
      const hp = stats.find("th:contains('HP')").next().first().text()
      const attack = stats.find("th:contains('Attack')").next().first().text()
      const defense = stats.find("th:contains('Defense')").next().first().text()
      const speed = stats.find("th:contains('Speed')").next().first().text()
      const specialAttack = stats.find("th:contains('Sp. Atk')").next().first().text()
      const specialDefense = stats.find("th:contains('Sp. Def')").next().first().text()
      const total = stats.find("th:contains('Total')").next().first().text()

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
