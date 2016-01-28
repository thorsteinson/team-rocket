import * as request from 'request'
import * as cheerio from 'cheerio'
import * as csv from 'csv'
import {Promise} from 'bluebird'

Promise.promisifyAll(request)
Promise.promisifyAll(cheerio)
Promise.promisifyAll(csv)

console.log('Hello world')
