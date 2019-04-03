const {promisify} = require('util')
const redis = require('redis')
const client = redis.createClient()

const lpush = promisify(client.lpush).bind(client)

// this is used by both PRODUCER and CONSUMER, so pulled it out into common util
// the other functions in PRODUCER and CONSUMER, are used specific to those entities, respectively
const pushToQueue = async (queueName, data) => {
  try {
    await lpush(queueName, data)
  } catch(e) {
    console.error(`Error pushing to queue: ${e}`)
  }
}

module.exports = {
  pushToQueue
}
