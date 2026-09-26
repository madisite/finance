import "dotenv/config";
import pg from "pg";

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

try {
  const result = await pool.query("SELECT current_user, current_database(), version()");
  console.log(`PostgreSQL ready: ${result.rows[0].current_user}@${result.rows[0].current_database}`);
} catch (error) {
  const code = typeof error === "object" && error !== null && "code" in error ? String((error as { code?: unknown }).code ?? "") : "";
  console.error(`PostgreSQL check failed (${code}). Ensure role madi-site owns database northstar and DATABASE_URL is valid.`);
  process.exitCode = 1;
} finally {
  await pool.end();
}