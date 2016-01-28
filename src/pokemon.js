// Model for parsing pokemon data and for creating a CSV row representing a
// pokemon

export {parsePokemon}

import * as _ from 'lodash'

// Parsing utilities

// Parse the type string, and return an object representing both types
// Types are Primary and Secondary. The secondary type may be undefined.
function parseType (str) {
  // Use regex to split into more useful array
  const parsed = str.split(/\b/)

  // Filter only whole words
  const [primaryType, secondaryType] = _.filter(parsed, token => token.match(/^\w+$/))

  return {primaryType, secondaryType}
}

// Parse the string containing the height and return the numerical value in
// meters
function parseHeight (str) {
  const regex = /\((\d+.\d+) ?m\)/

  // Return the matched subgroup
  return parseFloat(str.match(regex)[1])
}

// Exactly like height, but instead handles weight
function parseWeight (str) {
  const regex = /\((\d+.\d+) ?kg\)/

  // Return the matched subgroup
  return parseFloat(str.match(regex)[1])
}

// Parse the effort value and return the type of value, and amount in an
// object
function parseEV (str) {
  // matches the effort value, and type in subgroups
  const regex = /(\d) (\w+( \w+)?)/

  const matches = str.match(regex)
  return {value: matches[1], type: matches[2]}
}

// Some values have text descriptions with the numberes. This gets the number
// in a greedy fashion
function extractFloat (str) {
  const regex = /\d+/

  return parseFloat(str.match(regex)[0])
}

// Returns the gender ratio as an object
// Both male and female are 0 if genderless
function parseGender (str) {
  const regex = /(\d|\.)+% male, (\d|\.)+% female/

  const matches = str.match(regex)
  // genderless case
  if (!matches) {
    return {male: 0, female: 0}
  } else {
    return {
      male: parseFloat(matches[1]),
      female: parseFloat(matches[2])
    }
  }
}

// Takes an object with all of our data, and parses it so that it's more
// friendly to work with / export
function parsePokemon (data) {
  return {
    id: parseInt(data.id, 10),
    type: parseType(data.type),
    species: data.species,
    height: parseHeight(data.height),
    weight: parseWeight(data.weight),
    evYield: parseEV(data.ev),
    catchRate: parseFloat(data.catchRate),
    baseExp: parseFloat(data.baseExp),
    growthRate: data.growthRate,
    gender: parseGender(data.gender),
    eggCycles: extractFloat(data.eggCycles),
    hp: parseFloat(data.hp),
    speed: parseFloat(data.speed),
    attack: parseFloat(data.attack),
    specialAttack: parseFloat(data.specialAttack),
    defense: parseFloat(data.defense),
    speicalDefense: parseFloat(data.specialDefense),
    total: parseFloat(data.total)
  }
}
