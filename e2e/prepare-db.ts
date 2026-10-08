/**
 * Prepares the throwaway database the E2E suite runs against, then applies the migrations.
 *
 * Runs as a plain Node script so it uses the E2E `DATABASE_URL` directly instead of the developer's
 * `.env.local`. Playwright invokes it through the `webServer` command, before the app is built.
 */
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";

const url = process.env.DATABASE_URL ?? "postgresql://postgres:password@localhost:5432/sho_vee_e2e";
const target = new URL(url);
const databaseName = decodeURIComponent(target.pathname.replace(/^\//, ""));

if (!/(e2e|test)/i.test(databaseName)) {
  throw new Error(
    `Refusing to reset "${databaseName}": the E2E database name must contain "e2e" or "test".`,
  );
}

// Connect to the maintenance database on the same server so the target database can be created.
const admin = postgres({
  host: target.hostname,
  port: Number(target.port || 5432),
  username: decodeURIComponent(target.username),
  password: decodeURIComponent(target.password),
  database: "postgres",
  max: 1,
});

const [existing] = await admin`SELECT 1 FROM pg_database WHERE datname = ${databaseName}`;
if (existing.length === 0) {
  await admin.unsafe(`CREATE DATABASE "${databaseName}"`);
  console.log(`[e2e] created database ${databaseName}`);
}
await admin.end();

// A fresh schema per run keeps assertions like "this report has not been filed yet" deterministic.
// `drizzle` holds the applied-migration ledger, so it has to go too — otherwise the migrator skips
// every migration while the tables it "already applied" are gone.
const sql = postgres(url, { max: 1 });
await sql.unsafe("DROP SCHEMA IF EXISTS public CASCADE");
await sql.unsafe("DROP SCHEMA IF EXISTS drizzle CASCADE");
await sql.unsafe("CREATE SCHEMA public");
await migrate(drizzle({ client: sql }), { migrationsFolder: "drizzle" });
await sql.end();

console.log(`[e2e] ${databaseName} reset and migrated`);
