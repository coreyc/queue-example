const {consume, doWork} = require('./consumer')

const WORK_QUEUE = 'work_queue'
const PROCESSING_QUEUE = 'processing_queue'

const run = (async () => {
  const exit = () => {process.exit(0)}
  await consume(doWork, WORK_QUEUE, PROCESSING_QUEUE, exit)
})()