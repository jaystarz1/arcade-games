import { drizzle } from "drizzle-orm/neon-serverless";
import { Pool, neonConfig } from "@neondatabase/serverless";
import ws from "ws";

// Database connection is optional - if DATABASE_URL is not set,
// the application will fall back to in-memory storage
let db: ReturnType<typeof drizzle> | null = null;

if (process.env.DATABASE_URL) {
  // Configure WebSocket for server-side usage
  neonConfig.webSocketConstructor = ws;

  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  db = drizzle(pool);
}

export { db };
