const express = require("express");
const shevchenko = require('shevchenko');
const { militaryExtension } = require('shevchenko-ext-military');

shevchenko.registerExtension(militaryExtension);

const app = express();

app.use(express.json());

async function toGrammaticalCase({ grammaticalCase, personData }) {
  try {
    if (personData.gender.toLowerCase() == 'ч') personData.gender = 'masculine';
    else if (personData.gender.toLowerCase() == 'ж') personData.gender = 'feminine';

    switch(grammaticalCase.toLowerCase()) {
      case 'родовий':
        return shevchenko.inGenitive(personData);
      case 'давальний':
        return shevchenko.inDative(personData);
      case 'знахідний':
        return shevchenko.inAccusative(personData);
      case 'орудний':
        return shevchenko.inAblative(personData);
      case 'місцевий':
        return shevchenko.inLocative(personData);
      case 'кличний':
        return shevchenko.inVocative(personData);
    }
  } catch (e) {
    return `${e.name}: ${e.message}`;
  }
}

const toGrammaticalCaseAll = async (data) => Array.isArray(data) ?
  Promise.all(data.map(item => toGrammaticalCase(item))) : 
  toGrammaticalCase(data);

app.get("/", (req, res) => {
  res.send('express-shevchenko');
});

app.post('/', (req, res) => {
  toGrammaticalCaseAll(req.body).then(result => res.send(result));
});

module.exports = app;
