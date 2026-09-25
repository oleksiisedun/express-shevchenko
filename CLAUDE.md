# express-shevchenko

A thin Express wrapper around the [shevchenko](https://github.com/tooleks/shevchenko-js) library (with the `shevchenko-ext-military` extension) that declines Ukrainian names/military fields into a requested grammatical case. Single source file: `api/index.js`. Deployed to Vercel as a serverless function.

## Commands

- `npm start` — run the server locally (`PORT` env var, default `3000`).
- `npm test` — run unit tests (`node --test`, no extra framework).
- `npm run lint` — ESLint.
- `npm run format:check` — Prettier check (`npm run format` to auto-fix).
- `npm run check` — runs lint, format:check, and test together; run this before committing a logic change.

## Conventions

- `CASE_HANDLERS` (in `api/index.js`) maps a lowercase Ukrainian case name to the `shevchenko` function that performs that declension. Add new cases here, not as a new `if`/`switch`.
- `GENDER_MAP` maps the short Ukrainian gender codes (`ч`/`ж`) to the full values `shevchenko` expects (`masculine`/`feminine`). `normalizePersonData` applies it before calling a handler — `shevchenko` throws on the short codes directly, see `tests/api.test.js`.
- Plain `.js` file: every function needs a JSDoc comment with `@param`/`@returns` (no other source of type info here).
- The error-handling `app.use` must stay last so malformed-JSON and unexpected errors come back as JSON, not Express's HTML page.
- Tests live in `tests/*.test.js` and exercise the HTTP API directly (`app.listen(0)` + `fetch`), not the internal handler functions — `app` is the only thing `api/index.js` exports.
