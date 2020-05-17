# queue-example

## Running

### Setup Redis and Postgres
Run `docker-compose up` to create a Redis instance and a Postgres instance (which includes our schema too)

### Run producer
From the root of the project, do `node src/producer.js`. This will insert some work items into Redis

### Run worker
From the root of the project, do `node src/consumer-run.js`. This will pull the items from the queue and do the actual work of inserting into the database.

### Cleanup Redis queues
As you're playing around with the project, the queues might get filled up. To cleanup the work queue and the processing queue, from the root of the project, do `sh cleanup-redis.sh`