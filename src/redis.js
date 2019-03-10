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
// generic function to handle multiple different queues
// we might have one queue for one type of task, another for a diff type of task
// and to be clear, we're not storing the task itself, we just store the task (or message) data
// processing queue name would not necessarily need to be aligned with that, but probably a good idea
const getWork = async (queue, processingQueue) => {
  try {
    // this removes from work/todo queue
    return await rpoplpush(queue, processingQueue)
  } catch(e) {
    console.error(`Error getting the work: ${e}`)
  }
}

const doWork = async (workItem, processingQueue) => {
  try {
    await insert('books', workItem, 'isbn_default')
    await lrem(processingQueue, 1, workItem)
  } catch(e) {
    console.error(`Error doing the work: ${e}`)
  }
}

for (let i = 0; i <= 50; i++) {
  pushToQueue('work_queue', i)
}

// TODO: best way to poll for them? what if doWork takes longer than the interval?
setInterval(async () => {
  const workItem = await getWork('work_queue', 'processing_queue')
  await doWork(workItem, 'processing_queue')
  
  console.log('popped from queue:', workItem)
}, 3000)