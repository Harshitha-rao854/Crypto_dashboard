import fs from "fs";
import path from "path";

const DB_PATH = path.resolve("server", "db.json");

const defaultDb = {
  users: [],
  watchlists: {},
  portfolios: {},
};

function ensureDb() {
  if (!fs.existsSync(DB_PATH)) {
    fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
    fs.writeFileSync(DB_PATH, JSON.stringify(defaultDb, null, 2));
  }
}

export function readDb() {
  ensureDb();
  const raw = fs.readFileSync(DB_PATH, "utf-8");
  return JSON.parse(raw);
}

export function writeDb(nextDb) {
  fs.writeFileSync(DB_PATH, JSON.stringify(nextDb, null, 2));
}
