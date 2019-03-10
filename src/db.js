const { Client } = require('pg')

const getConnection = () => {
  return {
    host: 'localhost',
    database: 'books',
    password: null,
    port: 5432
  }
}

const insert = async (tableName, bookNumber, isbn) => {
  const client = new Client(getConnection())
  await client.connect()

  let res
  
  try {
    res = await client.query(`INSERT INTO ${tableName} (book_number, isbn) VALUES ('${bookNumber}', '${isbn}');`)
  } catch(e) {
    throw new Error(`Error inserting: ${e}`)
  }

  await client.end()
  return res
}

module.exports = {
  insert
}