const express = require('express');
const app = express();
const port = 3000;

app.get('/', (req, res) => {
  res.json({ message: 'Test server is running!' });
});

app.listen(port, '127.0.0.1', () => {
  console.log(`Test server listening at http://127.0.0.1:${port}`);
});