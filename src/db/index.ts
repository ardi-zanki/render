import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import { env } from "@/env";
import * as schema from "./schema";

/**
 * Singleton postgres-js client + Drizzle instance. Reuses the connection
 * across hot reloads in dev to avoid exhausting connections.
 */
const globalForDb = globalThis as unknown as {
  __renderaiClient?: ReturnType<typeof postgres>;
};

const client =
  globalForDb.__renderaiClient ??
  postgres(env.DATABASE_URL, { max: env.NODE_ENV === "production" ? 10 : 5 });

if (env.NODE_ENV !== "production") {
  globalForDb.__renderaiClient = client;
}

export const db = drizzle(client, { schema });
export { schema };
export type Database = typeof db;
