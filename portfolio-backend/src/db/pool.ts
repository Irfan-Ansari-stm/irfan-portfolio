import { Pool, PoolClient } from 'pg';
import { env } from '../config/env';

export const pool = new Pool({
  connectionString: env.DATABASE_URL || undefined,
  host: env.DATABASE_URL ? undefined : env.DB_HOST,
  port: env.DATABASE_URL ? undefined : env.DB_PORT,
  database: env.DATABASE_URL ? undefined : env.DB_NAME,
  user: env.DATABASE_URL ? undefined : env.DB_USER,
  password: env.DATABASE_URL ? undefined : env.DB_PASSWORD,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

pool.on('error', (err) => {
  console.error('Unexpected DB pool error:', err);
});

export async function query<T = any>(
  text: string,
  params?: any[]
): Promise<{ rows: T[]; rowCount: number }> {
  const start = Date.now();
  const res = await pool.query(text, params);
  const duration = Date.now() - start;
  if (env.NODE_ENV === 'development') {
    console.log('🔍 query:', { text: text.slice(0, 80), duration, rows: res.rowCount });
  }
  return { rows: res.rows, rowCount: res.rowCount ?? 0 };
}

export async function getClient(): Promise<PoolClient> {
  return pool.connect();
}

export async function withTransaction<T>(
  fn: (client: PoolClient) => Promise<T>
): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await fn(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

export async function testConnection(): Promise<void> {
  try {
    const result = await query('SELECT NOW()');
    console.log('✅ Database connected at:', result.rows[0].now);
  } catch (err) {
    console.error('❌ Database connection failed:', err);
    throw err;
  }
}
