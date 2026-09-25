<h1 align="center">express-shevchenko</h1>
<h2 align="center">REST API for Ukrainian grammatical declension of military ranks and names</h2>

A thin Express wrapper around the [shevchenko](https://github.com/tooleks/shevchenko-js) library with the [shevchenko-ext-military](https://github.com/tooleks/shevchenko-ext-military) extension. Accepts a person's name and military data and returns it declined into the requested grammatical case. Accepts a single object or a batch array.

---

## Endpoints

### `GET /`

Health check. Returns `express-shevchenko`.

---

### `POST /`

Decline a person's name and military fields into a Ukrainian grammatical case.

**Content-Type:** `application/json`

#### Request body

| Field             | Type   | Required | Description                                                                   |
| ----------------- | ------ | -------- | ----------------------------------------------------------------------------- |
| `grammaticalCase` | string | yes      | Target grammatical case (see [Supported cases](#supported-grammatical-cases)) |
| `personData`      | object | yes      | Person descriptor (see [Person fields](#person-fields))                       |

#### Person fields (`personData`)

| Field                 | Type   | Required | Description                                    |
| --------------------- | ------ | -------- | ---------------------------------------------- |
| `gender`              | string | yes      | `"ч"` / `"masculine"` or `"ж"` / `"feminine"`  |
| `familyName`          | string | no       | Last name                                      |
| `givenName`           | string | no       | First name                                     |
| `patronymicName`      | string | no       | Patronymic                                     |
| `militaryRank`        | string | no       | Military rank (e.g. `"солдат"`, `"полковник"`) |
| `militaryAppointment` | string | no       | Full appointment title                         |

At least one name or rank field should be provided.

#### Supported grammatical cases

| Value       | Case                    |
| ----------- | ----------------------- |
| `родовий`   | Genitive                |
| `давальний` | Dative                  |
| `знахідний` | Accusative              |
| `орудний`   | Ablative (Instrumental) |
| `місцевий`  | Locative                |
| `кличний`   | Vocative                |

---

## Examples

### Single person

**Request:**

```json
POST /
{
  "grammaticalCase": "родовий",
  "personData": {
    "gender": "ч",
    "militaryRank": "солдат",
    "militaryAppointment": "старший стрілець 2-го відділення 2-го взводу оперативного призначення 7-ої роти оперативного призначення (на бронетранспортерах) 3-го батальйону оперативного призначення",
    "familyName": "Шевченко",
    "givenName": "Тарас",
    "patronymicName": "Федорович"
  }
}
```

**Response:**

```json
{
  "givenName": "Тараса",
  "patronymicName": "Федоровича",
  "familyName": "Шевченка",
  "militaryRank": "солдата",
  "militaryAppointment": "старшого стрільця 2-го відділення 2-го взводу оперативного призначення 7-ої роти оперативного призначення (на бронетранспортерах) 3-го батальйону оперативного призначення"
}
```

---

### Batch (array)

Send an array of objects to decline multiple people in one request.

**Request:**

```json
POST /
[
  {
    "grammaticalCase": "давальний",
    "personData": {
      "gender": "ч",
      "militaryRank": "полковник",
      "familyName": "Коваленко",
      "givenName": "Іван",
      "patronymicName": "Петрович"
    }
  },
  {
    "grammaticalCase": "кличний",
    "personData": {
      "gender": "ж",
      "militaryRank": "лейтенант",
      "familyName": "Мельник",
      "givenName": "Олена",
      "patronymicName": "Василівна"
    }
  }
]
```

**Response:** an array of declined person objects in the same order.

If any item in the batch is invalid, the whole request fails with a single `400` error — there is no partial success.

---

## Error responses

All errors return a JSON body — HTTP `400` for invalid requests, `500` for unexpected server errors:

```json
{ "error": "..." }
```

Common errors:

- Missing `grammaticalCase` or `personData` (or not a string / object)
- Unknown grammatical case value
- Invalid or missing `gender`
- Malformed JSON body

---

## Running locally

```bash
npm install
npm start
```

The server listens on the port defined by the `PORT` environment variable (default: `3000`).

## Development

```bash
npm test              # unit tests (node --test)
npm run lint          # ESLint (incl. required JSDoc in api/)
npm run format:check  # Prettier (check only)
npm run format        # Prettier (auto-fix)
npm run check         # lint + format:check + test
```

---

## Deployment

The project is configured for deployment on [Vercel](https://vercel.com) as a serverless function via `api/index.js`.
