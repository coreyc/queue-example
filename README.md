# queue-example
In order to install Redis (it will be installed locally to this project), run `sh setup.sh` from the root of this repo.

# Run redis-server
`sh run-redis.sh`

## Install Postgres (homebrew)
(You'll need Homebrew installed)

`brew install postgres`

## Start Postgres
`pg_ctl -D /usr/local/var/postgres start`

## Create database and table
`createdb books`

Then: `psql books` followed by: `CREATE TABLE books (book_number int, isbn text)`

To exit psql: `\q`