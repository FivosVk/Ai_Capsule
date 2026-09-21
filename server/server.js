// server.js - main entry point
require("dotenv").config();

const path = require("path");
const express = require("express");
const cookieParser = require("cookie-parser");
const cors = require("cors");

const authenticateJWT = require("./middleware/authenticateJWT");
const authRoutes = require("./routes/auth");
const capsuleRoutes = require("./routes/capsules");

const app = express();
const PORT = process.env.PORT || 5000;

// --- sanity check required env vars up front, so misconfiguration fails loudly ---
["JWT_SECRET", "GITHUB_CLIENT_ID", "GITHUB_CLIENT_SECRET", "GITHUB_CALLBACK_URL"].forEach((key) => {
  if (!process.env[key]) {
    console.warn(`WARNING: environment variable ${key} is not set. See server/.env.example`);
  }
});

app.use(express.json());
app.use(cookieParser());

// Only needed if you ever split frontend/backend onto different origins.
// Since we serve React from this same Express app, this is mostly a safety net.
app.use(
  cors({
    origin: true,
    credentials: true,
  })
);

// ---------- Public routes ----------
app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

app.use("/", authRoutes); // provides GET /login and GET /auth/github/callback

// ---------- Protected API routes ----------
app.use("/api/capsules", authenticateJWT, capsuleRoutes);

// ---------- Serve the built React frontend ----------
// Run `npm run build` inside /client first (see root README).
const clientBuildPath = path.join(__dirname, "..", "client", "dist");
app.use(express.static(clientBuildPath));

// Any other GET request that isn't an API route falls through to React Router.
app.get(/^\/(?!api\/|auth\/|login).*/, (req, res) => {
  res.sendFile(path.join(clientBuildPath, "index.html"));
});

app.listen(PORT, () => {
  console.log(`AI Capsule server listening on port ${PORT}`);
});