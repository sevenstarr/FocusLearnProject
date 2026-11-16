import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema.ts';

declare global {
  var _postgresPool: Pool | undefined;
}

export const createPool = () => {
  if (!global._postgresPool) {
    global._postgresPool = new Pool({
      host: process.env.SQL_HOST,
      user: process.env.SQL_USER,
      password: process.env.SQL_PASSWORD,
      database: process.env.SQL_DB_NAME,
      max: 10,
      idleTimeoutMillis: 10000,
      connectionTimeoutMillis: 15000,
      keepAlive: true,
    });

    global._postgresPool.on('error', (err: Error & { code?: string }) => {
      const msg = err?.message || '';
      const isBenignIdleDisconnect =
        msg.includes('Connection terminated unexpectedly') ||
        msg.includes('terminating connection due to administrator command') ||
        err?.code === 'ECONNRESET' ||
        err?.code === 'EPIPE' ||
        err?.code === '57P01';

      if (isBenignIdleDisconnect) {
        return;
      }
      console.error('SQL pool client error:', err);
    });
  }
  return global._postgresPool;
};

const pool = createPool();

export const db = drizzle(pool, { schema });
