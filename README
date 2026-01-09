(Project README for a small TypeScript Node.js utility)

# ksense

Lightweight TypeScript utility for fetching and working with patient records (example project). Provides a small CLI entry at `src/main.ts` and type definitions in `src/interfaces.ts`.

**Quick summary**
- Minimal Node+TypeScript project using `ts-node` + `nodemon` for development.
- Includes a `get(url)` helper in `src/main.ts` that performs HTTP(S) GET requests and prints status + body.
- Interfaces describing the API response shape are in `src/interfaces.ts`.

**Requirements**
- Node.js 18+ recommended
- npm

Getting started

1. Install dependencies

```bash
npm install
```

2. Run the script (development watch)

```bash
npm start
```

Files of interest
- `src/main.ts` — contains exported `get(url)` helper and a small CLI runner that prints `Status:` and `Body:`.
- `src/interfaces.ts` — TypeScript interfaces for the API response (`PatientsApiResponse`, `PatientRecord`, `Pagination`, `Metadata`) and a `Resp` helper type for the expected response.
- `nodemon.json` — nodemon configuration used by `npm start`.

Usage notes
- `get(url)` returns a Promise resolving to `{ status: number; body: string }` and will reject on network error, invalid URL, or timeout.

Development suggestions
- Add unit tests with your preferred framework (Jest, Vitest) for the validator and the HTTP helper.