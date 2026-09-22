// routes/auth.js
// Handles the GitHub OAuth "Web Application Flow" by hand (no passport, no sessions).
// Reference: https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/authorizing-oauth-apps
//
// Flow:
//   1. GET /login            -> redirect browser to GitHub's authorize page
//   2. GitHub redirects back -> GET /auth/github/callback?code=...
//   3. We exchange the code for a GitHub access token (server-to-server, never sent to browser)
//   4. We use that access token ONCE to fetch the GitHub profile (id, login)
//   5. We sign OUR OWN application JWT containing { sub: githubId, login }
//   6. We set that JWT in a Secure, HttpOnly cookie named "token"
//   7. We redirect the browser to /dashboard

const express = require("express");
const jwt = require("jsonwebtoken");

const router = express.Router();

const {
  GITHUB_CLIENT_ID,
  GITHUB_CLIENT_SECRET,
  GITHUB_CALLBACK_URL,
  JWT_SECRET,
  NODE_ENV,
} = process.env;

router.get("/login", (req, res) => {
  const params = new URLSearchParams({
    client_id: GITHUB_CLIENT_ID,
    redirect_uri: GITHUB_CALLBACK_URL,
    scope: "read:user",
  });
  res.redirect(`https://github.com/login/oauth/authorize?${params.toString()}`);
});

router.get("/auth/github/callback", async (req, res) => {
  const { code } = req.query;
  if (!code) {
    return res.status(400).send("Missing OAuth code from GitHub.");
  }

  try {
    // Step 1: exchange the temporary code for an access token.
    const tokenResp = await fetch("https://github.com/login/oauth/access_token", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        client_id: GITHUB_CLIENT_ID,
        client_secret: GITHUB_CLIENT_SECRET,
        code,
        redirect_uri: GITHUB_CALLBACK_URL,
      }),
    });
    const tokenData = await tokenResp.json();

    if (!tokenData.access_token) {
      console.error("GitHub token exchange failed:", tokenData);
      return res.status(401).send("GitHub OAuth failed during token exchange.");
    }

    // Step 2: use the GitHub access token to fetch the user's profile.
    const profileResp = await fetch("https://api.github.com/user", {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
        "User-Agent": "ai-capsule-app",
      },
    });
    const profile = await profileResp.json();

    if (!profile || !profile.id) {
      console.error("GitHub profile fetch failed:", profile);
      return res.status(401).send("GitHub OAuth failed while fetching profile.");
    }

    // Step 3: issue OUR OWN application JWT. This is NOT the GitHub access token.
    const appToken = jwt.sign(
      { sub: String(profile.id), login: profile.login },
      JWT_SECRET,
      { expiresIn: "2h" }
    );

    // Step 4: store it in a Secure, HttpOnly cookie named "token", per spec.
    res.cookie("token", appToken, {
      httpOnly: true,
      secure: NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 2 * 60 * 60 * 1000, // 2 hours
    });

    res.redirect("/dashboard");
  } catch (err) {
    console.error("OAuth callback error:", err);
    res.status(500).send("Something went wrong during login.");
  }
});

router.post("/logout", (req, res) => {
  res.clearCookie("token");
  res.json({ ok: true });
});

module.exports = router;