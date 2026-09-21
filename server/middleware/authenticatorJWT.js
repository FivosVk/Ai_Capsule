// middleware/authenticateJWT.js
// Verifies the application JWT stored in the httpOnly "token" cookie.
// This is what makes /api/capsules "protected" - no valid JWT, no access.

const jwt = require("jsonwebtoken");

function authenticateJWT(req, res, next) {
  const token = req.cookies && req.cookies.token;

  if (!token) {
    return res.status(401).json({ error: "Unauthorized: no token provided" });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    // payload.sub is the GitHub user id - this is the ONLY place user identity
    // comes from. The frontend/browser is never trusted to say who it is.
    req.userId = payload.sub;
    req.userLogin = payload.login;
    next();
  } catch (err) {
    // Covers expired tokens, tampered tokens, and completely fake tokens
    // (e.g. "Cookie: token=fake-token-123" from the required cURL test).
    return res.status(401).json({ error: "Unauthorized: invalid token" });
  }
}

module.exports = authenticateJWT;