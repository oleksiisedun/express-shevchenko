const express = require("express");
const shevchenko = require('shevchenko');
const { militaryExtension } = require('shevchenko-ext-military');

shevchenko.registerExtension(militaryExtension);

const app = express();

app.use(express.json());

const CASE_HANDLERS = {
  'родовий': (data) => shevchenko.inGenitive(data),
  'давальний': (data) => shevchenko.inDative(data),
  'знахідний': (data) => shevchenko.inAccusative(data),
  'орудний': (data) => shevchenko.inAblative(data),
  'місцевий': (data) => shevchenko.inLocative(data),
  'кличний': (data) => shevchenko.inVocative(data),
};

const GENDER_MAP = {
  'ч': 'masculine',
  'ж': 'feminine',
};

function normalizePersonData(personData) {
  const gender = GENDER_MAP[personData.gender?.toLowerCase()] ?? personData.gender;
  return { ...personData, gender };
}

async function toGrammaticalCase({ grammaticalCase, personData }) {
  if (!grammaticalCase || !personData) {
    throw new Error('grammaticalCase and personData are required');
  }

  const handler = CASE_HANDLERS[grammaticalCase.toLowerCase()];
  if (!handler) {
    throw new Error(`Unknown grammatical case: "${grammaticalCase}". Valid cases: ${Object.keys(CASE_HANDLERS).join(', ')}`);
  }

  return handler(normalizePersonData(personData));
}

app.get("/", (req, res) => {
  res.send('express-shevchenko');
});

app.post('/', async (req, res) => {
  const body = req.body;

  if (!body || (Array.isArray(body) && body.length === 0)) {
    return res.status(400).json({ error: 'Request body is required' });
  }

  try {
    const result = Array.isArray(body)
      ? await Promise.all(body.map(item => toGrammaticalCase(item)))
      : await toGrammaticalCase(body);
    res.json(result);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

if (require.main === module) {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => console.log(`Listening on http://localhost:${PORT}`));
}

module.exports = app;
