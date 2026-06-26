import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

declare global {
  // eslint-disable-next-line no-var
  var _pgPool: Pool | undefined;
}

function getPool(): Pool {
  if (!global._pgPool) {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      // Return a dummy pool for build time - will fail at runtime without DB
      console.warn("[DB] DATABASE_URL not set — database will not be available");
    }
    global._pgPool = new Pool({
      connectionString: connectionString || "postgresql://localhost:5432/dummy",
      ssl: connectionString?.includes("neon.tech") || connectionString?.includes("supabase")
        ? { rejectUnauthorized: false }
        : undefined,
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
    });
  }
  return global._pgPool;
}

export const db = drizzle(getPool(), { schema });
export type DB = typeof db;
