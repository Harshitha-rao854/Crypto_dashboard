import { createClient } from "@supabase/supabase-js";
import { readDb, writeDb } from "./db.js";

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;
const useSupabase = Boolean(supabaseUrl && supabaseServiceRole);

const supabase = useSupabase
  ? createClient(supabaseUrl, supabaseServiceRole, {
      auth: { persistSession: false, autoRefreshToken: false },
    })
  : null;

function normalizeUser(row) {
  if (!row) return null;
  return {
    id: row.id,
    username: row.username,
    passwordHash: row.passwordHash ?? row.password_hash,
  };
}

export async function findUserByUsername(username) {
  const normalized = String(username || "").trim().toLowerCase();
  if (!normalized) return null;

  if (useSupabase) {
    const { data, error } = await supabase
      .from("users")
      .select("id, username, password_hash")
      .ilike("username", normalized)
      .maybeSingle();
    if (error) throw error;
    return normalizeUser(data);
  }

  const db = readDb();
  const user = db.users.find((u) => u.username.toLowerCase() === normalized);
  return normalizeUser(user);
}

export async function createUser({ id, username, passwordHash }) {
  if (useSupabase) {
    const { data, error } = await supabase
      .from("users")
      .insert({
        id,
        username,
        password_hash: passwordHash,
      })
      .select("id, username, password_hash")
      .single();
    if (error) throw error;

    await supabase.from("watchlists").upsert({ user_id: data.id, coin_ids: [] });
    await supabase.from("portfolios").upsert({ user_id: data.id, holdings: [] });
    return normalizeUser(data);
  }

  const db = readDb();
  const user = { id, username, passwordHash };
  db.users.push(user);
  db.watchlists[id] = [];
  db.portfolios[id] = [];
  writeDb(db);
  return user;
}

export async function getWatchlist(userId) {
  if (useSupabase) {
    const { data, error } = await supabase
      .from("watchlists")
      .select("coin_ids")
      .eq("user_id", userId)
      .maybeSingle();
    if (error) throw error;
    return Array.isArray(data?.coin_ids) ? data.coin_ids : [];
  }

  const db = readDb();
  return db.watchlists[userId] || [];
}

export async function setWatchlist(userId, coinIds) {
  if (useSupabase) {
    const { data, error } = await supabase
      .from("watchlists")
      .upsert({ user_id: userId, coin_ids: coinIds }, { onConflict: "user_id" })
      .select("coin_ids")
      .single();
    if (error) throw error;
    return Array.isArray(data?.coin_ids) ? data.coin_ids : [];
  }

  const db = readDb();
  db.watchlists[userId] = coinIds;
  writeDb(db);
  return db.watchlists[userId];
}

export async function getPortfolio(userId) {
  if (useSupabase) {
    const { data, error } = await supabase
      .from("portfolios")
      .select("holdings")
      .eq("user_id", userId)
      .maybeSingle();
    if (error) throw error;
    return Array.isArray(data?.holdings) ? data.holdings : [];
  }

  const db = readDb();
  return db.portfolios[userId] || [];
}

export async function setPortfolio(userId, holdings) {
  if (useSupabase) {
    const { data, error } = await supabase
      .from("portfolios")
      .upsert({ user_id: userId, holdings }, { onConflict: "user_id" })
      .select("holdings")
      .single();
    if (error) throw error;
    return Array.isArray(data?.holdings) ? data.holdings : [];
  }

  const db = readDb();
  db.portfolios[userId] = holdings;
  writeDb(db);
  return db.portfolios[userId];
}

export function isSupabaseEnabled() {
  return useSupabase;
}

