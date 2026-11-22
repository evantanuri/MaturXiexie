import { Pool } from "pg";
import bcrypt from "bcryptjs";
import { env } from "./env";

export const pool = new Pool({
  connectionString: env.DATABASE_URL,
  max: 10,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 5_000,
});

export async function checkDatabaseHealth(): Promise<boolean> {
  try {
    await pool.query("SELECT 1");
    return true;
  } catch {
    return false;
  }
}

export async function initDatabase(): Promise<void> {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      email VARCHAR(150) UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      reputation_score INTEGER NOT NULL DEFAULT 100,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS api_keys (
      id SERIAL PRIMARY KEY,
      group_name VARCHAR(100) UNIQUE NOT NULL,
      key_value VARCHAR(128) UNIQUE NOT NULL,
      is_active BOOLEAN NOT NULL DEFAULT TRUE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS reports (
      id SERIAL PRIMARY KEY,
      reporter_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      lat DOUBLE PRECISION NOT NULL,
      lng DOUBLE PRECISION NOT NULL,
      category VARCHAR(50) NOT NULL,
      severity INTEGER NOT NULL CHECK (severity BETWEEN 1 AND 5),
      is_disability_barrier BOOLEAN NOT NULL DEFAULT FALSE,
      description TEXT,
      status VARCHAR(20) NOT NULL DEFAULT 'pending',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      expires_at TIMESTAMPTZ NOT NULL
    );

    CREATE TABLE IF NOT EXISTS report_validations (
      id SERIAL PRIMARY KEY,
      report_id INTEGER NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
      validator_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      action VARCHAR(20) NOT NULL CHECK (action IN ('confirm', 'reject', 'resolve')),
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE (report_id, validator_id)
    );
  `);

  await seedDatabase();
}

async function seedDatabase(): Promise<void> {
  const userCount = await pool.query<{ count: string }>("SELECT COUNT(*) AS count FROM users");
  if (Number(userCount.rows[0].count) > 0) {
    return;
  }

  const demoHash = await bcrypt.hash("demo123", 10);
  const evanHash = await bcrypt.hash("evan123", 10);
  const satriaHash = await bcrypt.hash("satria123", 10);

  const insertedUsers = await pool.query<{ id: number; email: string }>(
    `INSERT INTO users (name, email, password_hash, reputation_score)
     VALUES
       ('Demo StepSafe', 'demo@stepsafe.test', $1, 120),
       ('Evan Nathanael', 'evan@stepsafe.test', $2, 115),
       ('Satria Guna', 'satria@stepsafe.test', $3, 110)
     ON CONFLICT (email) DO NOTHING
     RETURNING id, email`,
    [demoHash, evanHash, satriaHash]
  );

  await pool.query(
    `INSERT INTO api_keys (group_name, key_value, is_active)
     VALUES
       ('mitra-health-demo', 'stepsafe_key_mitra_health_2026', TRUE),
       ('mitra-tourism-demo', 'stepsafe_key_mitra_tourism_2026', TRUE)
     ON CONFLICT (group_name) DO NOTHING`
  );

  const demoUser = insertedUsers.rows.find((u) => u.email === "demo@stepsafe.test");
  const evanUser = insertedUsers.rows.find((u) => u.email === "evan@stepsafe.test");
  const satriaUser = insertedUsers.rows.find((u) => u.email === "satria@stepsafe.test");

  if (!demoUser || !evanUser || !satriaUser) {
    return;
  }

  // Seed sample reports around ITB Ganesha (-6.8915, 107.6107) with 7-day TTL.
  const reportsResult = await pool.query<{ id: number }>(
    `INSERT INTO reports (reporter_id, lat, lng, category, severity, is_disability_barrier, description, status, expires_at)
     VALUES
       ($1, -6.8915, 107.6107, 'no_ramp', 4, TRUE, 'Akses trotoar depan gerbang belum memiliki ramp kursi roda.', 'verified', NOW() + INTERVAL '7 days'),
       ($2, -6.8922, 107.6114, 'broken_surface', 3, FALSE, 'Paving trotoar bergelombang dan licin saat hujan.', 'verified', NOW() + INTERVAL '7 days'),
       ($3, -6.8908, 107.6101, 'blocked_path', 4, TRUE, 'Jalur pemandu tunanetra terhalang parkir kendaraan.', 'pending', NOW() + INTERVAL '7 days')
     RETURNING id`,
    [demoUser.id, evanUser.id, satriaUser.id]
  );

  const [report1, report2] = reportsResult.rows;
  if (report1 && report2) {
    await pool.query(
      `INSERT INTO report_validations (report_id, validator_id, action)
       VALUES
         ($1, $3, 'confirm'),
         ($1, $4, 'confirm'),
         ($2, $5, 'confirm'),
         ($2, $4, 'confirm')
       ON CONFLICT (report_id, validator_id) DO NOTHING`,
      [report1.id, report2.id, evanUser.id, satriaUser.id, demoUser.id]
    );
  }
}
