const redis = require('redis')
const client = redis.createClient()

const {pushToQueue} = require('./util')

const WORK_QUEUE = 'work_queue'

client.on('connect', () => {
  console.log('Redis client connected')
})

client.on('error', err => {
  console.log(`Redis client connection error: ${err}`)
})

const run = (async() => {
  // producer - seed the queue
  for (let i = 1; i <= 20; i++) {
    await pushToQueue(WORK_QUEUE, JSON.stringify({
      itemNum: i,
      isbn: 'default'
    }))
  }

  console.log('finished seeding items to work queue')

  // just for demo purposes, to close out
  process.exit()
})()
