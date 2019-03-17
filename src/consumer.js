const {promisify} = require('util')
const redis = require('redis')
const client = redis.createClient()

const {pushToQueue} = require('./producer')
const {insert} = require('./db')

const rpoplpush = promisify(client.rpoplpush).bind(client)
const lrem = promisify(client.lrem).bind(client)
const lrange = promisify(client.lrange).bind(client)

const WORK_QUEUE = 'work_queue'
const PROCESSING_QUEUE = 'processing_queue'

client.on('connect', () => {
  console.log('Redis client connected')
})

client.on('error', err => {
  console.log(`Redis client connection error: ${err}`)
})

// TODO: is polling method the best way? try blocking
// TODO: queue diagram (how it fills up), worker on different server

// consumer / worker
// generic function to handle multiple different queues
// we might have one queue for one type of task, another for a diff type of task
// and to be clear, we're not storing the task itself, we just store the task (or message) data
// processing queue name would not necessarily need to be aligned with that, but probably a good idea
const peek = async (queueName) => {
  // returns first item without popping it
  return await lrange(queueName, 0, 0)
}

const checkStales = async (queueName, timeout) => {
  const item = await peek(queueName)

  if (!item.timestamp) return null

  const timeSpentInQueue = Date.now() - item.timestamp

  if (timeSpentInQueue > timeout) {
    // if it fails, next consumer will try again, no try/catch needed
    return await pushToQueue(queueName, item) // requeue for processing by consumers
  }

  return null
}

const getWork = async (workQueue, processingQueue) => {
  try {
    // this removes from work/todo queue
    return await rpoplpush(workQueue, processingQueue)
  } catch(e) {
    throw new Error(e)
  }
}

const doWork = async (workItem, processingQueue) => {
  const {itemNum, isbn} = JSON.parse(workItem)

  try {
    // if insert fails, lrem won't be called and it won't be removed from processingQueue
    // would need another worker to watch processing queue and if items there for a while, run them again
    await insert('books', itemNum, isbn)
    await lrem(processingQueue, 1, workItem)
  } catch(e) {
    throw new Error(e)
  }
}

// will return an array
const getQueueLength = async (queueName) => {
  // don't care about error, if no length work will just queue up
  return await lrange(queueName, 0, -1)
}

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms))

const run = (async() => {  
  // first, check stale items in processing queue
  await checkStales(WORK_QUEUE, 120000) // 2 minute stale time

  // next, do work stuff
  let workQueueHasWork = await getQueueLength(WORK_QUEUE)
  while (workQueueHasWork.length) {
    // not necessary, just to be able to see the console logging more easily
    await sleep(500)

    let workItem

    try {
      workItem = await getWork(WORK_QUEUE, PROCESSING_QUEUE)
    } catch(e) {
      console.error(`Error getting work item from ${PROCESSING_QUEUE} queue: ${e}`)
    }

    try {
      await doWork(workItem, PROCESSING_QUEUE)
      console.log(`completed work item: ${workItem}`)
    } catch(e) {
      console.error(`Error doing work from ${PROCESSING_QUEUE} queue: ${e}`)
    }
    
    queueHasWork = await getQueueLength(WORK_QUEUE)
  }
})()
