import bcrypt from "bcryptjs";
import jwt, { SignOptions } from "jsonwebtoken";
import { pool } from "../../config/database";
import { env } from "../../config/env";
import { AppError } from "../../utils/errors";

export interface UserProfile {
  id: number;
  name: string;
  email: string;
  reputation_score: number;
  created_at: string;
}

interface UserRow extends UserProfile {
  password_hash: string;
}

function signAccessToken(user: { id: number; email: string }): string {
  const options: SignOptions = {
    subject: String(user.id),
    expiresIn: env.JWT_EXPIRES_IN as SignOptions["expiresIn"],
  };
  return jwt.sign({ email: user.email }, env.JWT_SECRET, options);
}

function toUserProfile(row: UserRow | UserProfile): UserProfile {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    reputation_score: row.reputation_score,
    created_at: new Date(row.created_at).toISOString(),
  };
}

export async function registerUser(input: {
  name: string;
  email: string;
  password: string;
}): Promise<{ token: string; user: UserProfile }> {
  const normalizedEmail = input.email.trim().toLowerCase();
  const existing = await pool.query("SELECT id FROM users WHERE email = $1", [normalizedEmail]);
  if ((existing.rowCount ?? 0) > 0) {
    throw new AppError(409, "EMAIL_EXISTS", "Email sudah terdaftar.");
  }

  const passwordHash = await bcrypt.hash(input.password, 10);
  const inserted = await pool.query<UserProfile>(
    `INSERT INTO users (name, email, password_hash)
     VALUES ($1, $2, $3)
     RETURNING id, name, email, reputation_score, created_at`,
    [input.name.trim(), normalizedEmail, passwordHash]
  );

  const user = toUserProfile(inserted.rows[0]);
  const token = signAccessToken(user);
  return { token, user };
}

export async function loginUser(input: {
  email: string;
  password: string;
}): Promise<{ token: string; user: UserProfile }> {
  const normalizedEmail = input.email.trim().toLowerCase();
  const result = await pool.query<UserRow>(
    `SELECT id, name, email, password_hash, reputation_score, created_at
     FROM users
     WHERE email = $1
     LIMIT 1`,
    [normalizedEmail]
  );

  if (result.rowCount === 0) {
    throw new AppError(401, "INVALID_CREDENTIALS", "Email atau password salah.");
  }

  const row = result.rows[0];
  const validPassword = await bcrypt.compare(input.password, row.password_hash);
  if (!validPassword) {
    throw new AppError(401, "INVALID_CREDENTIALS", "Email atau password salah.");
  }

  const user = toUserProfile(row);
  const token = signAccessToken(user);
  return { token, user };
}

export async function getUserProfile(userId: number): Promise<UserProfile> {
  const result = await pool.query<UserProfile>(
    `SELECT id, name, email, reputation_score, created_at
     FROM users
     WHERE id = $1
     LIMIT 1`,
    [userId]
  );

  if (result.rowCount === 0) {
    throw new AppError(404, "USER_NOT_FOUND", "Pengguna tidak ditemukan.");
  }
  return toUserProfile(result.rows[0]);
}
