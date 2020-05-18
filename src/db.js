const { Client } = require('pg')

const getConnection = () => {
  // normally you'd use env vars for this, just skipping that step here for demo purposes
  return {
    host: 'localhost',
    database: 'library',
    user: 'root',
    password: 'password',
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