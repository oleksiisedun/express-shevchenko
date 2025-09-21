const express = require("express");
const shevchenko = require('shevchenko');
const { militaryExtension } = require('shevchenko-ext-military');

shevchenko.registerExtension(militaryExtension);

const app = express();

app.use(express.json());

app.get("/", (req, res) => {
  res.send('express-shevchenko');
});

app.post('/', (req, res) => {
  shevchenko.inGenitive(req.body).then(result => res.send(result));
});

module.exports = app;
