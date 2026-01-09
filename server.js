import route from './routes/index';

const express = require('express');

const port = process.env.PORT || '5000';
const app = express();

app.use('/', route);

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
