const express = require('express');
const shevchenko = require('shevchenko');
const { militaryExtension } = require('shevchenko-ext-military');

shevchenko.registerExtension(militaryExtension);

const app = express();

app.use(express.json());

/** @typedef {import('shevchenko').DeclensionInput} DeclensionInput */

/**
 * Maps a lowercase Ukrainian grammatical case name to the shevchenko function that declines a person into it.
 * @type {Record<string, (data: DeclensionInput) => Promise<object>>}
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
 * shevchenko validates the rest of the fields itself, so the result is only asserted to be a DeclensionInput.
 * @param {Record<string, unknown>} personData
 * @returns {DeclensionInput}
 */
function normalizePersonData(personData) {
  const { gender } = personData;
  const normalizedGender =
    typeof gender === 'string' ? (GENDER_MAP[gender.toLowerCase()] ?? gender) : gender;
  return /** @type {DeclensionInput} */ ({ ...personData, gender: normalizedGender });
}

/**
 * Declines a single person's data into the requested Ukrainian grammatical case.
 * @param {unknown} item one request body, or one element of a batch array — unvalidated
 * @returns {Promise<object>}
 */
async function toGrammaticalCase(item) {
  const { grammaticalCase, personData } =
    /** @type {{ grammaticalCase?: unknown, personData?: unknown }} */ (item ?? {});
  if (typeof grammaticalCase !== 'string' || !personData || typeof personData !== 'object') {
    throw new Error('grammaticalCase and personData are required');
  }

  const handler = CASE_HANDLERS[grammaticalCase.toLowerCase()];
  if (!handler) {
    throw new Error(
      `Unknown grammatical case: "${grammaticalCase}". Valid cases: ${Object.keys(CASE_HANDLERS).join(', ')}`,
    );
  }

  return handler(normalizePersonData(/** @type {Record<string, unknown>} */ (personData)));
}

/**
 * Health check endpoint.
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @returns {void}
 */
function healthCheck(req, res) {
  res.send('express-shevchenko');
}

/**
 * Declines one person, or each person in a batch array, into their requested grammatical case.
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @returns {Promise<void>}
 */
async function declineHandler(req, res) {
  const body = req.body;

  if (!body || (Array.isArray(body) && body.length === 0)) {
    res.status(400).json({ error: 'Request body is required' });
    return;
  }

  try {
    const result = Array.isArray(body)
      ? await Promise.all(body.map((item) => toGrammaticalCase(item)))
      : await toGrammaticalCase(body);
    res.json(result);
  } catch (e) {
    res.status(400).json({ error: e instanceof Error ? e.message : String(e) });
  }
}

/**
 * Returns every error (including malformed JSON from express.json) as a JSON body.
 * @param {Error & { status?: number, expose?: boolean }} err
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} _next
 * @returns {void}
 */
function jsonErrorHandler(err, req, res, _next) {
  const status = err.status ?? 500;
  if (status >= 500) console.error(err);
  res.status(status).json({ error: err.expose ? err.message : 'Internal server error' });
}

app.get('/', healthCheck);
app.post('/', declineHandler);
app.use(jsonErrorHandler);

if (require.main === module) {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => console.log(`Listening on http://localhost:${PORT}`));
}

module.exports = app;
