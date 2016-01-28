import * as request from 'request'
import * as cheerio from 'cheerio'
import * as csv from 'csv'
import {Promise} from 'bluebird'

Promise.promisifyAll(cheerio)
Promise.promisifyAll(csv)
Promise.promisifyAll(request, {multiArgs: true})

console.log('Hello world')

request.getAsync('https://www.google.com/')
  .then(([code, body]) => {
    console.log(`Code: ${code.statusCode}`)
    console.log(`Body: ${body}`)
  })
