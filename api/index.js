const express = require('express');
const shevchenko = require('shevchenko');
const { militaryExtension } = require('shevchenko-ext-military');

shevchenko.registerExtension(militaryExtension);

const app = express();

app.use(express.json());

/**
 * Maps a lowercase Ukrainian grammatical case name to the shevchenko function that declines a person into it.
 * @type {Record<string, (data: object) => Promise<object>>}
 */
const CASE_HANDLERS = {
  родовий: (data) => shevchenko.inGenitive(data),
  давальний: (data) => shevchenko.inDative(data),
  знахідний: (data) => shevchenko.inAccusative(data),
  орудний: (data) => shevchenko.inAblative(data),
  місцевий: (data) => shevchenko.inLocative(data),
  кличний: (data) => shevchenko.inVocative(data),
};

/**
 * Maps the short Ukrainian gender codes to the gender values shevchenko expects.
 * @type {Record<string, string>}
 */
const GENDER_MAP = {
  ч: 'masculine',
  ж: 'feminine',
};

/**
 * Normalizes personData's gender field from a short Ukrainian code to the full value shevchenko expects.
 * @param {object} personData
 * @returns {object}
 */
function normalizePersonData(personData) {
  const gender = GENDER_MAP[personData.gender?.toLowerCase()] ?? personData.gender;
  return { ...personData, gender };
}

/**
 * Declines a single person's data into the requested Ukrainian grammatical case.
 * @param {{ grammaticalCase: string, personData: object }} params
 * @returns {Promise<object>}
 */
async function toGrammaticalCase({ grammaticalCase, personData }) {
  if (!grammaticalCase || !personData) {
    throw new Error('grammaticalCase and personData are required');
  }

  const handler = CASE_HANDLERS[grammaticalCase.toLowerCase()];
  if (!handler) {
    throw new Error(
      `Unknown grammatical case: "${grammaticalCase}". Valid cases: ${Object.keys(CASE_HANDLERS).join(', ')}`,
    );
  }

  return handler(normalizePersonData(personData));
}

/**
 * Health check endpoint.
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @returns {void}
 */
app.get('/', (req, res) => {
  res.send('express-shevchenko');
});

/**
 * Declines one person, or each person in a batch array, into their requested grammatical case.
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @returns {Promise<void>}
 */
app.post('/', async (req, res) => {
  const body = req.body;

  if (!body || (Array.isArray(body) && body.length === 0)) {
    return res.status(400).json({ error: 'Request body is required' });
  }

  try {
    const result = Array.isArray(body)
      ? await Promise.all(body.map((item) => toGrammaticalCase(item)))
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
