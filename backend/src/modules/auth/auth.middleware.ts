import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { env } from "../../config/env";
import { pool } from "../../config/database";
import { AppError } from "../../utils/errors";

export interface AuthenticatedUser {
  userId: number;
  email: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
      apiClient?: { groupName: string };
    }
  }
}

function verifyBearerToken(authHeader?: string): AuthenticatedUser | null {
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }
  const token = authHeader.slice("Bearer ".length).trim();
  if (!token) {
    return null;
  }

  try {
    const decoded = jwt.verify(token, env.JWT_SECRET) as {
      sub?: string | number;
      email?: string;
    };
    const userId = Number(decoded.sub);
    if (!Number.isInteger(userId) || !decoded.email) {
      return null;
    }
    return { userId, email: decoded.email };
  } catch {
    return null;
  }
}

export function requireJwt(req: Request, _res: Response, next: NextFunction): void {
  const user = verifyBearerToken(req.headers.authorization);
  if (!user) {
    return next(
      new AppError(401, "UNAUTHORIZED", "Token Bearer JWT tidak ada atau tidak valid.")
    );
  }
  req.user = user;
  next();
}

export async function requireApiKeyOrJwt(
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> {
  const user = verifyBearerToken(req.headers.authorization);
  if (user) {
    req.user = user;
    return next();
  }

  const rawApiKey = req.headers["x-api-key"];
  const apiKey = Array.isArray(rawApiKey) ? rawApiKey[0] : rawApiKey;
  if (!apiKey) {
    return next(
      new AppError(
        401,
        "UNAUTHORIZED",
        "Diperlukan header Authorization (Bearer JWT) atau X-API-Key yang valid."
      )
    );
  }

  try {
    const result = await pool.query<{ group_name: string }>(
      `SELECT group_name FROM api_keys WHERE key_value = $1 AND is_active = TRUE LIMIT 1`,
      [apiKey]
    );
    if (result.rowCount === 0) {
      return next(new AppError(401, "UNAUTHORIZED", "X-API-Key tidak valid atau nonaktif."));
    }
    req.apiClient = { groupName: result.rows[0].group_name };
    next();
  } catch (err) {
    next(err);
  }
}
