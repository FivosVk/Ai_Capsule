# AI Capsule

Cloud-deployed AI prompt manager - Assignment 3 (CSE3CWA / CSE5006).

Deployed on **Render** as a single web service (React frontend + Express API served
together from one app, one public URL).



## 1. Deployed application

- **Public URL:** https://ai-capsule-xtkr.onrender.com
- **Cloud platform:** Render (free web service tier)
- **Build command:** `npm run build`
- **Start command:** `npm start`


## 2. Tech stack

- Frontend: React (Vite)
- Backend: Node.js + Express
- Auth: GitHub OAuth -> Express issues its own application JWT
- Storage: SQLite (`better-sqlite3`)


## 3. Project structure
ai-capsule/
client/ React frontend (Vite)
server/ Express backend + SQLite
package.json root convenience scripts (used as Render's build/start commands)


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

Then open `http://localhost:5001` 

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
so the browser sends the `token` cookie with every request. Because Render serves
the built React app and the Express API from the same web service and origin, no
cross-origin (CORS) configuration is needed.


## 6. OAuth & JWT

- **OAuth provider:** GitHub
- **Flow:** `GET /login` redirects to GitHub's authorize page. GitHub redirects back
  to `GET /auth/github/callback` with a `code`. The server exchanges that code for a
  GitHub access token, fetches the GitHub profile, then **signs its own application
  JWT** (`{ sub: githubUserId, login }`) with `jsonwebtoken` and `JWT_SECRET`.
- **Storage:** the JWT is set as a `Secure, HttpOnly` cookie named `token`
  (see `server/routes/auth.js`). It is never stored in localStorage and never sent
  as an `Authorization` header. `secure: true` works correctly on Render because
  Render terminates HTTPS for you automatically on the `onrender.com` URL.
- **Verification:** `server/middleware/authenticateJWT.js` reads the `token`
  cookie, verifies it with `jsonwebtoken.verify`, and attaches the decoded GitHub
  user id to `req.userId`. All `/api/capsules` routes use this middleware.
- **Ownership:** every capsule row stores `user_id = req.userId` from the verified
  JWT. The frontend never sends `user_id`, and it is ignored even if it did.


## 7. Environment variables

Set these in Render's dashboard under the web service's **Environment** tab
(never commit real values):

| Name | Purpose |
|---|---|
| `JWT_SECRET` | Signs/verifies the application JWT |
| `GITHUB_CLIENT_ID` | GitHub OAuth App client ID |
| `GITHUB_CLIENT_SECRET` | GitHub OAuth App client secret |
| `GITHUB_CALLBACK_URL` | Set to `https://ai-capsule-xtkr.onrender.com/auth/github/callback` - must match the OAuth App's callback URL exactly |
| `NODE_ENV` | `production` |
| `PORT` | Not set manually - Render injects this automatically |

The `GITHUB_CALLBACK_URL` on Render and the **Authorization callback URL** on the
GitHub OAuth App (github.com/settings/developers) must be identical, including
the `https://` scheme.


## 8. Database

- SQLite file created automatically at `server/db/capsules.db` on first run
  (see `server/db/db.js` for the `CREATE TABLE IF NOT EXISTS` statement).
- Each row is tied to a user via `user_id` (the GitHub user id from the verified JWT).
- **Persistence:** Render's free web service uses an **ephemeral filesystem** -
  `capsules.db` is reset to empty whenever the service restarts, redeploys, or
  spins down after inactivity and wakes back up. This is a known trade-off of the
  free tier and is stated honestly here rather than hidden (see Section 10).


## 9. Required cURL security tests

**Test 1 - no authentication:**
HTTP/2 401
{"error":"Unauthorized: no token provided"}

**Test 2 - fake/invalid JWT:**
HTTP/2 401
{"error":"Unauthorized: no token provided"}

Both requests correctly return `401 Unauthorized` before any protected capsule data is
returned - the first because no `token` cookie is present at all, and the second because
a cookie is present but fails JWT verification (`jsonwebtoken.verify` rejects it), proving
the middleware actually validates the token rather than merely checking a cookie exists.


## 10. Known limitation

SQLite storage on Render's free tier is ephemeral: the service's local disk is
wiped on every restart, redeploy, or wake-from-sleep, so saved capsules do not
persist indefinitely. For this assignment's scope this is an accepted trade-off
of using the free tier rather than a paid persistent disk or a managed Postgres
database; the CRUD behaviour itself is fully correct while the service is running.


## 11. AI-assisted development

claude was used to assist in starter code and debugging while attempting deployment via render