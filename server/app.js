import express from "express";
import cors from "cors";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import { readDb, writeDb } from "./db.js";
import { requireAuth, signToken } from "./auth.js";
import {
  getCoinDetails,
  getCoinDetailsByCurrency,
  getMarkets,
  getMarketsByCurrency,
} from "./marketCache.js";

const app = express();

app.use(
  cors({
    // For this project, allow same-origin and deployed clients without strict origin blocking.
    // This avoids preflight/network failures on Vercel preview/production URLs.
    origin: true,
    credentials: true,
  })
);
app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.json({ ok: true });
});

app.post("/api/auth/signup", async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ message: "Username and password are required." });
  }

  const db = readDb();
  if (db.users.find((u) => u.username.toLowerCase() === username.toLowerCase())) {
    return res.status(409).json({ message: "Username already exists." });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = {
    id: crypto.randomUUID(),
    username,
    passwordHash,
  };
  db.users.push(user);
  db.watchlists[user.id] = [];
  db.portfolios[user.id] = [];
  writeDb(db);

  const token = signToken(user);
  return res.status(201).json({ token, user: { id: user.id, username: user.username } });
});

app.post("/api/auth/login", async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ message: "Username and password are required." });
  }

  const db = readDb();
  const user = db.users.find((u) => u.username.toLowerCase() === username.toLowerCase());
  if (!user) return res.status(401).json({ message: "Invalid credentials." });

  const isValid = await bcrypt.compare(password, user.passwordHash);
  if (!isValid) return res.status(401).json({ message: "Invalid credentials." });

  const token = signToken(user);
  return res.json({ token, user: { id: user.id, username: user.username } });
});

app.get("/api/coins/markets", async (req, res) => {
  try {
    const vsCurrency = req.query?.vs_currency;
    const data = vsCurrency ? await getMarketsByCurrency(vsCurrency) : await getMarkets();
    return res.json(data);
  } catch {
    return res.status(502).json({ message: "Unable to fetch market data." });
  }
});

app.get("/api/coins/:id/details", async (req, res) => {
  try {
    const vsCurrency = req.query?.vs_currency;
    const days = req.query?.days;
    const data =
      vsCurrency || days
        ? await getCoinDetailsByCurrency(req.params.id, vsCurrency, days)
        : await getCoinDetails(req.params.id);
    return res.json(data);
  } catch {
    return res.status(502).json({ message: "Unable to fetch coin details." });
  }
});

app.get("/api/watchlist", requireAuth, (req, res) => {
  const db = readDb();
  return res.json(db.watchlists[req.user.id] || []);
});

app.put("/api/watchlist", requireAuth, (req, res) => {
  const { coinIds } = req.body;
  if (!Array.isArray(coinIds)) return res.status(400).json({ message: "coinIds must be array." });
  const db = readDb();
  db.watchlists[req.user.id] = coinIds;
  writeDb(db);
  return res.json(db.watchlists[req.user.id]);
});

app.get("/api/portfolio", requireAuth, (req, res) => {
  const db = readDb();
  return res.json(db.portfolios[req.user.id] || []);
});

app.put("/api/portfolio", requireAuth, (req, res) => {
  const { holdings } = req.body;
  if (!Array.isArray(holdings)) return res.status(400).json({ message: "holdings must be array." });
  const db = readDb();
  db.portfolios[req.user.id] = holdings;
  writeDb(db);
  return res.json(db.portfolios[req.user.id]);
});

export default app;

