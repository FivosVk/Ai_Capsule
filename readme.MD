# AI Capsule

Cloud-deployed AI prompt manager - Assignment 3 (CSE3CWA / CSE5006).

> Fill in every `TODO` before submitting. This file is part of the assessment evidence.

## 1. Deployed application

- **Public URL:** TODO (e.g. `https://13-211-44-90.sslip.io` or your Render URL)
- **Cloud platform:** TODO (e.g. AWS EC2 + Nginx + Let's Encrypt, or Render)

## 2. Tech stack

- Frontend: React (Vite)
- Backend: Node.js + Express
- Auth: GitHub OAuth -> Express issues its own application JWT
- Storage: SQLite (`better-sqlite3`)

## 3. Project structure

i-capsule/
client/ React frontend (Vite)
server/ Express backend + SQLite
package.json root convenience scripts


## 4. Install & run locally

```bash
# 1. Install dependencies for both server and client
npm run install:all

# 2. Configure environment variables
cp server/.env.example server/.env
# then edit server/.env and fill in JWT_SECRET, GITHUB_CLIENT_ID,
# GITHUB_CLIENT_SECRET, GITHUB_CALLBACK_URL (see section 6)

# 3. Build the React frontend into client/dist
npm run build

# 4. Start the Express server (serves the API AND the built frontend)
npm start
```

Then open `http://localhost:5000`.

(For frontend-only hot-reload development, you can instead run `npm run dev:server`
in one terminal and `npm run dev:client` in another - Vite proxies `/api`, `/login`
and `/auth` to the Express server on port 5000.)

## 5. Required API routes

| Route | Access | Purpose |
|---|---|---|
| `/` | Public | Landing page |
| `/login` | Public | Starts GitHub OAuth login |
| `/dashboard` | Protected | Shows the authenticated user's records |
| `GET /api/health` | Public | Returns `{ "status": "ok" }` |
| `GET /api/capsules` | Protected | Read own records |
| `POST /api/capsules` | Protected | Create own record |
| `PUT /api/capsules/:id` | Protected | Update own record |
| `DELETE /api/capsules/:id` | Protected | Delete own record |

The React frontend calls these routes with `fetch(..., { credentials: "include" })`
so the browser sends the `token` cookie with every request. Because the frontend
is served by the same Express app, no cross-origin configuration is needed.

## 6. OAuth & JWT

- **OAuth provider:** GitHub (`TODO: or "Google, because ..." if you used the fallback`)
- **Flow:** `GET /login` redirects to GitHub's authorize page. GitHub redirects back
  to `GET /auth/github/callback` with a `code`. The server exchanges that code for a
  GitHub access token, fetches the GitHub profile, then **signs its own application
  JWT** (`{ sub: githubUserId, login }`) with `jsonwebtoken` and `JWT_SECRET`.
- **Storage:** the JWT is set as a `Secure, HttpOnly` cookie named `token`
  (see `server/routes/auth.js`). It is never stored in localStorage and never sent
  as an `Authorization` header.
- **Verification:** `server/middleware/authenticateJWT.js` reads the `token`
  cookie, verifies it with `jsonwebtoken.verify`, and attaches the decoded GitHub
  user id to `req.userId`. All `/api/capsules` routes use this middleware.
- **Ownership:** every capsule row stores `user_id = req.userId` from the verified
  JWT. The frontend never sends `user_id`, and it is ignored even if it did.

## 7. Environment variables

Set these in your cloud platform's dashboard (never commit real values):

| Name | Purpose |
|---|---|
| `JWT_SECRET` | Signs/verifies the application JWT |
| `GITHUB_CLIENT_ID` | GitHub OAuth App client ID |
| `GITHUB_CLIENT_SECRET` | GitHub OAuth App client secret |
| `GITHUB_CALLBACK_URL` | Must match the OAuth App's callback URL exactly |
| `PORT` | Usually set automatically by the platform |
| `NODE_ENV` | `production` on the deployed app |

## 8. Database

- SQLite file created automatically at `server/db/capsules.db` on first run
  (see `server/db/db.js` for the `CREATE TABLE IF NOT EXISTS` statement).
- Each row is tied to a user via `user_id` (the GitHub user id from the verified JWT).
- **Persistence:** TODO - state honestly whether your deployed platform's
  filesystem is persistent. On Render's free web service, the filesystem is
  ephemeral, so `capsules.db` is reset whenever the service restarts or
  redeploys. On an AWS EC2 instance, the file lives on the instance's own disk
  and survives reboots, but would be lost if you terminate the instance (and
  there's no redundancy since it's a single VM).

## 9. Required cURL security tests

Run against the deployed URL and paste your actual results below.

```bash
# Test 1 - no authentication
curl -i https://YOUR-APP/api/capsules
# Required: 401 Unauthorized

# Test 2 - fake / invalid JWT
curl -i -H "Cookie: token=fake-token-123" https://YOUR-APP/api/capsules
# Required: 401 Unauthorized
```

**Test 1 result:** TODO (paste status line / body)

**Test 2 result:** TODO (paste status line / body)

## 10. Known limitation

TODO - one honest limitation, e.g. "SQLite storage resets if the platform's
filesystem is ephemeral" or "this is a single EC2 instance with no redundancy,
so if it goes down there's no automatic failover."

## 11. AI-assisted development
AI used to assist with starter code, debugging, 
and breaking down the website requirements into steps.

- **AI tool(s) used:** TODO (e.g. Claude)
- **Problem found & corrected in AI-generated code/config:** TODO - describe
  something specific you caught and fixed (e.g. "the generated JWT middleware
  originally read the token from an Authorization header instead of the
  required `token` cookie, so I rewrote it to use `req.cookies.token`").
- **How OAuth/JWT/protected-API behaviour was verified:** TODO - describe
  running the two cURL tests, checking the cookie in devtools (HttpOnly,
  Secure), and confirming successful CRUD only after login.
- **How CRUD & ownership were verified:** TODO - describe testing CRUD with two
  different GitHub accounts (or two JWTs) and confirming each only sees its
  own records.
- **One implementation/deployment decision you can explain:** TODO (e.g. "I
  serve the React build from the same Express app instead of a separate static
  host, to avoid cross-origin cookie issues with the JWT.")