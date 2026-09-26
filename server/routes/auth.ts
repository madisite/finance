import { randomBytes, randomUUID, scrypt as scryptCallback, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import { RequestHandler } from "express";
import pg from "pg";

const { Pool } = pg;
const scrypt = promisify(scryptCallback);
const pool = process.env.DATABASE_URL ? new Pool({ connectionString: process.env.DATABASE_URL }) : null;

export const handleRegister: RequestHandler = async (req, res) => {
  if (!pool) {
    res.status(503).json({ message: "DATABASE_URL is not configured." });
    return;
  }

  const name = typeof req.body?.name === "string" ? req.body.name.trim() : "";
  const email = typeof req.body?.email === "string" ? req.body.email.trim().toLowerCase() : "";
  const password = typeof req.body?.password === "string" ? req.body.password : "";
  if (name.length < 2 || !email.includes("@") || email.startsWith("@") || email.endsWith("@") || password.length < 8) {
    res.status(400).json({ message: "Enter a valid name, email, and password of at least 8 characters." });
    return;
  }

  try {
    const existing = await pool.query("SELECT id FROM users WHERE email = $1", [email]);
    if (existing.rowCount) {
      res.status(409).json({ message: "An account with this email already exists." });
      return;
    }
    const passwordHash = await hashPassword(password);
    const result = await pool.query<{ email: string; display_name: string; role: "admin" }>(
      `INSERT INTO users (id, email, display_name, role, password_hash)
       VALUES ($1, $2, $3, 'admin', $4)
       RETURNING email, display_name, role`,
      [randomUUID(), email, name, passwordHash],
    );
    const user = result.rows[0];
    res.status(201).json({ user: { email: user.email, name: user.display_name, role: user.role } });
  } catch (error) {
    console.error("Registration failed:", error);
    res.status(500).json({ message: "Unable to create the account." });
  }
};

export const handleLogin: RequestHandler = async (req, res) => {
  const email = typeof req.body?.email === "string" ? req.body.email.trim().toLowerCase() : "";
  const password = typeof req.body?.password === "string" ? req.body.password : "";
  const demoEmail = process.env.DEMO_EMAIL ?? "demo@example.com";
  const demoPassword = process.env.DEMO_PASSWORD ?? "demo1234";

  if (email === demoEmail.toLowerCase() && password === demoPassword) {
    res.json({ user: { email: demoEmail, name: "Madi", role: "admin" } });
    return;
  }
  if (!pool) {
    res.status(503).json({ message: "DATABASE_URL is not configured." });
    return;
  }

  try {
    const result = await pool.query<{ email: string; display_name: string; role: "admin"; password_hash: string | null }>(
      "SELECT email, display_name, role, password_hash FROM users WHERE email = $1",
      [email],
    );
    const user = result.rows[0];
    if (!user?.password_hash || !(await verifyPassword(password, user.password_hash))) {
      res.status(401).json({ message: "Email or password is incorrect." });
      return;
    }
    res.json({ user: { email: user.email, name: user.display_name, role: user.role } });
  } catch (error) {
    console.error("Login failed:", error);
    res.status(500).json({ message: "Unable to sign in right now." });
  }
};

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const derivedKey = await scrypt(password, salt, 64) as Buffer;
  return `${salt}:${derivedKey.toString("hex")}`;
}

async function verifyPassword(password: string, stored: string) {
  const [salt, key] = stored.split(":");
  if (!salt || !key) return false;
  const derivedKey = await scrypt(password, salt, 64) as Buffer;
  const storedKey = Buffer.from(key, "hex");
  return storedKey.length === derivedKey.length && timingSafeEqual(storedKey, derivedKey);
}