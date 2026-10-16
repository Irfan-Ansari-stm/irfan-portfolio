/**
 * Run with:  npx ts-node src/db/migrate.ts
 * Or:        npx ts-node src/db/migrate.ts seed
 */
import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { pool } from './pool';

async function runSQL(filePath: string, label: string) {
  const sql = fs.readFileSync(filePath, 'utf-8');
  console.log(`\n⏳ Running ${label}...`);
  await pool.query(sql);
  console.log(`✅ ${label} complete.`);
}

async function main() {
  const arg = process.argv[2];

  try {
    if (arg === 'media') {
      await runSQL(
        path.join(__dirname, 'migrations', '002_media.sql'),
        'Schema migration 002 (Media Library)'
      );
    } else if (arg === 'seed') {
      await runSQL(
        path.join(__dirname, 'seeds', 'seed.sql'),
        'Seed data'
      );
    } else {
      await runSQL(
        path.join(__dirname, 'migrations', '001_schema.sql'),
        'Schema migration 001'
      );

      const mediaMigration = path.join(__dirname, 'migrations', '002_media.sql');
      if (fs.existsSync(mediaMigration)) {
        await runSQL(mediaMigration, 'Schema migration 002 (Media)');
      }

      if (arg === 'seed-after') {
        await runSQL(
          path.join(__dirname, 'seeds', 'seed.sql'),
          'Seed data'
        );
      }
    }
  } catch (err) {
    console.error('❌ Migration failed:', err);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main();
