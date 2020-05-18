const {promisify} = require('util')
const redis = require('redis')
const client = redis.createClient()

const {insert} = require('./db')

const rpoplpush = promisify(client.rpoplpush).bind(client)
const lrem = promisify(client.lrem).bind(client)
const lrange = promisify(client.lrange).bind(client)

client.on('connect', () => {
  console.log('Redis client connected')
})

client.on('error', err => {
  console.error(`Redis client connection error: ${err}`)
})

client.on('uncaughtException', err => {
  console.error(`There was an uncaught error: ${err}`)
  process.exit(1)
})

// consumer / worker
// generic function to handle multiple different queues
// we might have one queue for one type of task, another for a diff type of task
// and to be clear, we're not storing the task itself, we just store the task (or message) data
// processing queue name would not necessarily need to be aligned with that, but probably a good idea
const peek = async (queueName) => {
  // returns first item data without popping it
  const item = await lrange(queueName, 0, 0)

  if (item.length) {
    // lrange returns array of one item, so we need to return the item, not the array
    const itemFromArray = item[0]
    return JSON.parse(itemFromArray)
  }

  return null
}

const requeue = async (workQueue, processingQueue, workItem) => {
  const stringifiedWorkItem = JSON.stringify(workItem)

  try {
    await client
      .multi()
      .lpush(workQueue, stringifiedWorkItem)
      .lrem(processingQueue, 1, stringifiedWorkItem)
      .exec()
  } catch(e) {
    throw new Error(e)
  }
}

const checkStales = async (workQueue, processingQueue, timeout) => {
  const processingQueueItem = await peek(processingQueue)

  if (!processingQueueItem || !processingQueueItem.timestamp) return null

  const timeSpentInQueue = Date.now() - processingQueueItem.timestamp

  if (timeSpentInQueue > timeout) {
    // if it fails, next consumer will try again, no try/catch needed
    return await requeue(workQueue, processingQueue, processingQueueItem) // requeue for processing by consumers
  }

  return null
}

const getWork = async (workQueue, processingQueue) => {
  try {
    // this removes from work queue
    return await rpoplpush(workQueue, processingQueue)
  } catch(e) {
    throw new Error(e)
  }
}

const doWork = async (workItem) => {
  const {itemNum, isbn} = JSON.parse(workItem)

  try {
    // if insert fails, lrem won't be called and it won't be removed from processingQueue
    // would need another worker to watch processing queue and if items there for a while, run them again
    await insert('books', itemNum, isbn)
  } catch(e) {
    throw new Error(e)
  }
}

// will return an array
const checkQueueHasItems = async (queueName) => {
  // don't care about error, if no length work will just queue up
  return !!(await lrange(queueName, 0, -1)).length
}

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms))

const consume = async (doWork, workQueue, processingQueue, exit = () => {}) => {  
  let workQueueHasItems = await checkQueueHasItems(workQueue)

  while (workQueueHasItems) {
     // first, check stale items in processing queue
    await checkStales(workQueue, processingQueue, 120000) // 2 minute stale time
    
    // not necessary, just to be able to see the console logging output more easily
    await sleep(500)

    let workItem

    try {
      workItem = await getWork(workQueue, processingQueue)
    } catch(e) {
      console.error(`Error getting work item from ${processingQueue} queue: ${e}`)
    }

    try {
      await doWork(workItem)
      console.log(`completed work item: ${workItem}`)
      await lrem(processingQueue, 1, workItem)
    } catch(e) {
      console.error(e)
    }
    
    workQueueHasItems = await checkQueueHasItems(workQueue)
  }

  exit()
}

module.exports = {
  consume,
  doWork
}
