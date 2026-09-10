import { Pool, neonConfig, type PoolClient } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import { eq } from "drizzle-orm";
import ws from "ws";
import * as schema from "./schema";
import type { db } from "./index";

neonConfig.webSocketConstructor = ws;

function createTransactionDatabase(client: PoolClient) {
  return drizzle({ client, schema });
}

export type FinancialTransaction = Parameters<
  Parameters<ReturnType<typeof createTransactionDatabase>["transaction"]>[0]
>[0];

export type DatabaseExecutor = typeof db | FinancialTransaction;

/** One connection and user lock for the entire write and its downstream balances. */
export async function withFinancialTransaction<T>(
  userId: string,
  operation: (tx: FinancialTransaction) => Promise<T>,
): Promise<T> {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error("DATABASE_URL is not set");
  const pool = new Pool({ connectionString });
  try {
    // Own the checkout explicitly: Drizzle's pooled transaction path does not
    // release its client if BEGIN itself fails in the installed driver version.
    const client = await pool.connect();
    try {
      return await createTransactionDatabase(client).transaction(async (tx) => {
        const [user] = await tx
          .select({ id: schema.users.id })
          .from(schema.users)
          .where(eq(schema.users.id, userId))
          .for("update");
        if (!user) throw new Error("User not found");
        return operation(tx);
      }, { isolationLevel: "read committed" });
    } finally {
      // This connection is request-scoped. Destroy it even if BEGIN/ROLLBACK
      // failed so an open transaction cannot leak or keep pool.end() waiting.
      client.release(true);
    }
  } finally {
    // Cleanup must not turn an acknowledged commit into a reported save failure,
    // or hide the original transaction error. Do not log connection details.
    await pool.end().catch(() => {
      console.error("Failed to close financial database connection");
    });
  }
}
