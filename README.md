# queue-example

## First-time setup
To run the scripts below, you'll need bash/sh installed.

### Install Postgres
Install Postgres if it isn't already (you'll need Homebrew installed):

`brew install postgres`

### Create database and table
`createdb books`

Then: `psql books` followed by: `CREATE TABLE books (book_number int, isbn text)`

To exit psql: `\q`

### Setup Redis
From the root of the project, do `sh setup-redis.sh`

## Running
### Start Postgres
From the root of the project, do `sh start-postgres.sh`

### Start redis-server
From the root of the project, do `sh start-redis.sh`

### Cleanup Redis queues
As you're playing around with the project, the queues might get filled up. To cleanup the work queue and the processing queue, from the root of the project, do `sh cleanup-redis.sh`

### Run producer
From the root of the project, do `node src/producer.js`. This will insert some work items into Redis

### Run worker
From the root of the project, do `node src/consumer.js`. This will pull the items from the queue and do the actual work of inserting into the database.