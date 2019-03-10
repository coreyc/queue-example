setInterval(async () => {
  const todo = await getWork('work_queue', 'processing_queue')
  // TODO: insert into DB
  await insert('books', todo, 'isbn_default')
  console.log('popped from queue:', todo)
}, 3000)