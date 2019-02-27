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
  // don't await, just let it do its thing
  rpush(list, data)
}

const getFromQueue = async (list, otherList) => {
  return await rpoplpush(list, otherList)
}

pushToQueue('todo_queue', 'hello')
pushToQueue('todo_queue', 'world')

setInterval(async () => {
  const todo = await getFromQueue('todo_queue', 'work_queue')
  console.log('todo:', todo)
}, 3000)
