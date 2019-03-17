const {promisify} = require('util')
const redis = require('redis')
const client = redis.createClient()

const lpush = promisify(client.lpush).bind(client)

const WORK_QUEUE = 'work_queue'

client.on('connect', () => {
  console.log('Redis client connected')
})

client.on('error', err => {
  console.log(`Redis client connection error: ${err}`)
})

// producer
const pushToQueue = async (queueName, data) => {
  try {
    await lpush(queueName, data)
  } catch(e) {
    console.error(`Error pushing to queue: ${e}`)
  }
}

const run = (async() => {
  // producer - seed the queue
  for (let i = 1; i <= 20; i++) {
    await pushToQueue(WORK_QUEUE, JSON.stringify({
      itemNum: i,
      isbn: 'default'
    }))
  }

  // just for demo purposes, to close out
  process.exit()
})()

module.exports = {
  pushToQueue
}
