// Applies SQL files to the Supabase Postgres database.
//   npm run db:migrate   -> runs supabase/migrations/*.sql not yet applied (tracked in public.schema_migrations)
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import pg from "pg";

const command = process.argv[2];
const url = process.env.DATABASE_URL;
if (command !== "migrate") {
  console.error("Usage: node scripts/db.mjs migrate");
  process.exit(1);
}
if (!url) {
  console.error(
    "DATABASE_URL is not set.\n" +
      "Supabase dashboard -> Connect -> 'Session pooler' (or Direct connection) -> copy the URI,\n" +
      "replace [YOUR-PASSWORD] with your database password, and add it to .env as DATABASE_URL=...",
  );
  process.exit(1);
}

const client = new pg.Client({ connectionString: url, ssl: { rejectUnauthorized: false } });

async function runFile(file, label) {
  await client.query("begin");
  try {
    await client.query(readFileSync(file, "utf8").replace(/^﻿/, ""));
    await client.query("commit");
    console.log(`  ok  ${label}`);
  } catch (err) {
    await client.query("rollback");
    throw new Error(`${label}: ${err.message}`);
  }
}

try {
  await client.connect();
  {
    await client.query(
      "create table if not exists public.schema_migrations (name text primary key, applied_at timestamptz not null default now())",
    );
    const dir = join("supabase", "migrations");
    const applied = new Set((await client.query("select name from public.schema_migrations")).rows.map((r) => r.name));
    const files = readdirSync(dir).filter((f) => f.endsWith(".sql")).sort();
    let ran = 0;
    for (const f of files) {
      if (applied.has(f)) {
        console.log(`  --  ${f} (already applied)`);
        continue;
      }
      await runFile(join(dir, f), f);
      await client.query("insert into public.schema_migrations (name) values ($1)", [f]);
      ran++;
    }
    console.log(ran ? `Applied ${ran} migration(s).` : "Database is up to date.");
  }
} catch (err) {
  console.error("Failed:", err.message);
  process.exitCode = 1;
} finally {
  await client.end().catch(() => {});
}
