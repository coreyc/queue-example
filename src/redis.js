const {promisify} = require('util')
const redis = require('redis')
const client = redis.createClient()

const {insert} = require('./db')

const rpush = promisify(client.rpush).bind(client)
const rpoplpush = promisify(client.rpoplpush).bind(client)
const lrem = promisify(client.lrem).bind(client)

client.on('connect', () => {
  console.log('Redis client connected')
})

client.on('error', err => {
  console.log(`Something went wrong: ${err}`)
})

// producer
const pushToQueue = async (list, data) => {
  try {
    await rpush(list, data)
  } catch(e) {
    console.error(`Error pushing to queue: ${e}`)
  }
}


// TODO: explain why lifo/filo

// consumer / worker
const getWork = async (queue, processingQueue) => {
  try {
    // this removes from work/todo queue
    return await rpoplpush(queue, processingQueue).catch(e => {console.log(`Error getting from queue: ${e}`)})
    // this removes from processing queue, or should we do this after it's been processed?
    // await lrem(workQueue, workItem)
  } catch(e) {
    console.error(`Error getting the work item: ${e}`)
  }
}

for (let i = 0; i < 50; i++) {
  pushToQueue('work_queue', i)
}

setInterval(async () => {
  const todo = await getWork('work_queue', 'processing_queue')
  // TODO: insert into DB
  await insert('books', todo, 'isbn_default')
  console.log('popped from queue:', todo)
}, 3000)