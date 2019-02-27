const {promisify} = require('util')

const redis = require('redis')

const client = redis.createClient()

const rpush = promisify(client.rpush).bind(client)
const rpoplpush = promisify(client.rpoplpush).bind(client)

client.on('connect', () => {
  console.log('Redis client connected')
})

client.on('error', err => {
  console.log(`Something went wrong: ${err}`)
})

const pushToQueue = (list, data) => {
  rpush(list, data)
}

const getFromQueue = async (list, otherList) => {
  return await rpoplpush(list, otherList)
}

pushToQueue('test', 'hello')
pushToQueue('test', 'world')

setInterval(async () => {
  const todo = await getFromQueue('test', 'worker')
  console.log('todo:', todo)
}, 3000);