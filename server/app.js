import express from "express";
import cors from "cors";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import { requireAuth, signToken } from "./auth.js";
import {
  createUser,
  findUserByUsername,
  getPortfolio,
  getWatchlist,
  isSupabaseEnabled,
  setPortfolio,
  setWatchlist,
} from "./storage.js";
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
  res.json({ ok: true, storage: isSupabaseEnabled() ? "supabase" : "local" });
});

app.post("/api/auth/signup", async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ message: "Username and password are required." });
  }

  try {
    const normalizedUsername = String(username).trim();
    const existing = await findUserByUsername(normalizedUsername);
    if (existing) return res.status(409).json({ message: "Username already exists." });

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await createUser({
      id: crypto.randomUUID(),
      username: normalizedUsername,
      passwordHash,
    });

    const token = signToken(user);
    return res.status(201).json({ token, user: { id: user.id, username: user.username } });
  } catch {
    return res.status(500).json({ message: "Unable to create account right now." });
  }
});

app.post("/api/auth/login", async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ message: "Username and password are required." });
  }

  try {
    const user = await findUserByUsername(username);
    if (!user) return res.status(401).json({ message: "Invalid credentials." });

    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) return res.status(401).json({ message: "Invalid credentials." });

    const token = signToken(user);
    return res.json({ token, user: { id: user.id, username: user.username } });
  } catch {
    return res.status(500).json({ message: "Unable to login right now." });
  }
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

app.get("/api/watchlist", requireAuth, async (req, res) => {
  try {
    const watchlist = await getWatchlist(req.user.id);
    return res.json(watchlist);
  } catch {
    return res.status(500).json({ message: "Unable to fetch watchlist." });
  }
});

app.put("/api/watchlist", requireAuth, async (req, res) => {
  const { coinIds } = req.body;
  if (!Array.isArray(coinIds)) return res.status(400).json({ message: "coinIds must be array." });
  try {
    const saved = await setWatchlist(req.user.id, coinIds);
    return res.json(saved);
  } catch {
    return res.status(500).json({ message: "Unable to update watchlist." });
  }
});

app.get("/api/portfolio", requireAuth, async (req, res) => {
  try {
    const portfolio = await getPortfolio(req.user.id);
    return res.json(portfolio);
  } catch {
    return res.status(500).json({ message: "Unable to fetch portfolio." });
  }
});

app.put("/api/portfolio", requireAuth, async (req, res) => {
  const { holdings } = req.body;
  if (!Array.isArray(holdings)) return res.status(400).json({ message: "holdings must be array." });
  try {
    const saved = await setPortfolio(req.user.id, holdings);
    return res.json(saved);
  } catch {
    return res.status(500).json({ message: "Unable to update portfolio." });
  }
});

export default app;

