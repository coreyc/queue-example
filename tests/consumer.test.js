const chai = require('chai')
const chaiAsPromised = require('chai-as-promised');
const sinon = require('sinon')

const {consume} = require('../src/consumer')
const {pushToQueue, resetQueue, getRange} = require('../src/util')

const expect = chai.expect
chai.use(chaiAsPromised)

const WORK_QUEUE = 'test_work_queue'
const PROCESSING_QUEUE = 'test_processing_queue'

describe('consumer', () => {
  describe('#consume', () => {
    afterEach(async () => {
      await resetQueue(WORK_QUEUE)
      await resetQueue(PROCESSING_QUEUE)
    })

    after(() => {
      // do this because the consume() fn runs in a while loop
      process.exit(0)
    })

    it('should process items from the queue', async () => {
      // seed queue
      await pushToQueue(WORK_QUEUE, JSON.stringify({
        itemNum: 1,
        isbn: 'default',
        timestamp: Date.now()
      }))

      const doWork = sinon.spy()
      
      await consume(doWork, WORK_QUEUE, PROCESSING_QUEUE)

      expect(doWork.called).to.be.true
    })

    it('should not remove item from processing queue when processing item from the work queue fails', async () => {
      // seed queue
      await pushToQueue(WORK_QUEUE, JSON.stringify({
        itemNum: 1,
        isbn: 'default',
        timestamp: Date.now()
      }))

      const doWork = () => {throw Error('error test')}
      await consume(doWork, WORK_QUEUE, PROCESSING_QUEUE)
      
      const itemsInProcessingQueue = await getRange(PROCESSING_QUEUE)
      
      await expect(itemsInProcessingQueue).to.not.be.empty
    })

    it('should do nothing if no items in work queue', async () => {
      const doWork = sinon.spy()
      
      await consume(doWork, WORK_QUEUE)

      expect(doWork.called).to.be.false
    })
  })
})