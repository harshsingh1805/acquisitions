# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Common commands

- Install dependencies: `npm install`
- Start the dev server with file watching: `npm run dev`
- Lint all JavaScript files: `npm run lint`
- Lint and auto-fix issues: `npm run lint:fix`
- Format the codebase with Prettier: `npm run format`
- Check formatting without writing changes: `npm run format:check`
- Generate Drizzle migrations from the current schema: `npm run db:generate`
- Apply database migrations: `npm run db:migrate`
- Open Drizzle Studio to inspect the database: `npm run db:studio`

Notes:

- Environment variables are loaded via `dotenv` in `src/index.js`, so a `.env` file or equivalent environment configuration is expected.
- Database-related commands (`db:*`) require `DB_URL` to be set for the Neon/Postgres connection.

## Project architecture

This is a Node.js/Express API using ES modules (`"type": "module"` in `package.json`), Drizzle ORM, Neon serverless Postgres, Zod validation, Winston logging, and JWT/cookie-based authentication.

### Path aliases

`package.json` defines import aliases under `imports`:

- `#config/*` → `./src/config/*`
- `#db/*` → `./src/db/*`
- `#models/*` → `./src/models/*`
- `#routes/*` → `./src/routes/*`
- `#controllers/*` → `./src/controllers/*`
- `#middlewares/*` → `./src/middlewares/*`
- `#utils/*` → `./src/utils/*`
- `#services/*` → `./src/services/*`
- `#validations/*` → `./src/validations/*`

Use these aliases instead of long relative paths when adding new modules.

### Entry point and HTTP server

- `src/index.js`
  - Imports `dotenv/config` to load environment variables.
  - Imports `./server.js` to start the HTTP server.
- `src/server.js`
  - Imports the Express app from `./app.js`.
  - Reads `PORT` from `process.env.PORT` (default `3000`).
  - Calls `app.listen(PORT, ...)` and logs the running URL.

### Express app configuration

- `src/app.js`
  - Creates the Express app and registers core middleware:
    - `express.json()` and `urlencoded` for body parsing.
    - `helmet` for security headers.
    - `cors` for cross-origin requests.
    - `morgan` HTTP logging, wired into the shared Winston logger.
    - `cookie-parser` for cookie handling.
  - Defines health and basic info endpoints:
    - `GET /health` – status, timestamp, uptime.
    - `GET /` – simple text response and log message.
    - `GET /api` – basic API status.
  - Mounts feature routes:
    - `app.use('/api/auth', authRoutes);` where `authRoutes` is from `#routes/auth.routes.js`.

### Configuration layer

- `src/config/database.js`
  - Uses `@neondatabase/serverless` and `drizzle-orm/neon-http` to create a Neon SQL client and Drizzle `db` instance.
  - Exposes `{ db, sql }` for use in services and other database code.
- `src/config/logger.js`
  - Configures a Winston logger with JSON output, timestamps, and stack traces.
  - Writes to `log/error.log` and `log/combined.log`.
  - In non-production (`NODE_ENV !== 'production'`), also logs to the console with colors and a simple format.

### Auth routing and controller flow

- `src/routes/auth.routes.js`
  - Creates an Express router for auth endpoints under `/api/auth`:
    - `POST /sign-up` → `Singup` controller.
    - `POST /sign-in` – placeholder implementation.
    - `POST /sign-out` – placeholder implementation.
- `src/controllers/auth.controller.js`
  - `Singup` controller encapsulates the sign-up flow:
    - Validates `req.body` against `SignupSchema` from `#validations/auth.validation.js`.
    - On validation failure, responds with `400` and a formatted error message via `formatValidationError` from `#utils/format.js`.
    - On success, extracts `name`, `email`, `role`, `password` and delegates user creation to `CreateUser` from `#services/auth.service.js`.
    - After user creation, builds a JWT via `jwtoken.sign(...)` (`#utils/jwt.js`).
    - Sets an HTTP-only cookie named `token` using `cookies.set` from `#utils/cookies.js`.
    - Logs a sign-up message through the shared `logger` and responds with `201` plus basic user details.
    - If a user already exists (service throws a specific error message), responds with `409`.

This pattern—route → controller → service → database/model, with separate validation and utilities—is the intended layering for additional endpoints.

### Service and data access layer

- `src/services/auth.service.js`
  - Imports `db` from `#config/database.js` and the `users` table from `#models/user.model.js`.
  - `HashPassword(password)` – wraps `bcrypt.hash` with logging and a user-friendly error on failure.
  - `CreateUser({ name, email, password, role })`:
    - Checks for an existing user with the same email using Drizzle and `eq(users.email, email)`.
    - Throws an error if a duplicate user is found.
    - Hashes the password.
    - Inserts the new user into the `users` table and returns selected fields (including `id` and `created_at`).
    - Logs successful user creation.

- `src/models/user.model.js`
  - Defines the `users` table schema via `pgTable`:
    - `id` (serial primary key), `name`, `email` (unique), `password`, `role` (default `user`), `createdAt` (timestamp defaulting to now).
  - The corresponding Drizzle metadata and migrations are tracked under `drizzle/meta/`.

### Utilities and validation

- `src/utils/jwt.js`
  - Wraps `jsonwebtoken` with a small interface `jwtoken`:
    - `jwtoken.sign(payload)` – signs a JWT with `JWT_SECRET` from the environment (fallback default is provided but should be overridden in real deployments) and a `1d` expiry.
    - `jwtoken.verify(token)` – verifies and decodes a JWT.
  - Logs and throws descriptive errors when signing or verification fails.

- `src/utils/cookies.js`
  - Centralizes secure cookie options via `cookies.getOptions()`:
    - `httpOnly: true`, `sameSite: 'strict'`, `secure` based on `NODE_ENV`, 15-minute `maxAge`.
  - Provides `cookies.set(res, name, value, options)` and `cookies.clear(res, name, options)` helpers that merge defaults with any overrides.

- `src/utils/format.js`
  - `formatValidationError(errors)` converts Zod error objects into a user-readable string, joining all issue messages when available.

- `src/validations/auth.validation.js`
  - `SignupSchema` – Zod schema for sign-up fields: `name`, `email`, `password`, and `role` (`user` or `admin`).
  - `SigninSchema` – Zod schema for sign-in (`email`, `password`).

### Database metadata (Drizzle)

- `drizzle/meta/0000_snapshot.json` and `drizzle/meta/_journal.json`
  - Auto-generated Drizzle snapshot and migration journal describing the `users` table and its constraints.
  - These files are ignored by ESLint (see `eslint.config.js`) and generally should not be edited manually.

## Linting, formatting, and editor integration

- `eslint.config.js`
  - Extends `@eslint/js` recommended config.
  - Enforces 2-space indentation, single quotes, semicolons, `prefer-const`, `no-var`, and other modern JS best practices.
  - Disables `no-console` to allow logging where needed.
  - Marks test globals (`describe`, `it`, `expect`, etc.) as read-only for files under `tests/**/*.js`.
  - Ignores `node_modules/**`, `coverage/**`, `logs/**`, and `drizzle/**`.

- `.vscode/settings.json`
  - Enables `editor.formatOnSave` using Prettier.
  - Runs `source.fixAll.eslint` on save, so lint issues are auto-fixed when possible.
  - Validates JavaScript and React-JS files with ESLint.

## Testing status

- There is currently no test runner or `npm test` script defined in `package.json`.
- ESLint is preconfigured to support Jest-style globals in `tests/**/*.js`; when tests are added, they should live under that directory structure and a corresponding test script should be added to `package.json`.
