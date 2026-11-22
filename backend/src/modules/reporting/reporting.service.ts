import { PoolClient } from "pg";
import { pool } from "../../config/database";
import { AppError } from "../../utils/errors";
import { haversineDistanceMeters } from "../../utils/geo";
import {
  ReportCategory,
  ReportStatus,
  ValidationAction,
} from "./reporting.schema";

const CONSENSUS_THRESHOLD = 2;

export interface SidewalkReport {
  id: number;
  reporter_id: number;
  lat: number;
  lng: number;
  category: ReportCategory;
  severity: number;
  is_disability_barrier: boolean;
  description: string | null;
  status: ReportStatus;
  confirm_count: number;
  reject_count: number;
  resolve_count: number;
  created_at: string;
  expires_at: string;
}

interface ReportQueryRow {
  id: number;
  reporter_id: number;
  lat: number;
  lng: number;
  category: ReportCategory;
  severity: number;
  is_disability_barrier: boolean;
  description: string | null;
  status: ReportStatus;
  confirm_count: string | number;
  reject_count: string | number;
  resolve_count: string | number;
  created_at: Date | string;
  expires_at: Date | string;
}

const REPORT_SELECT_SQL = `
  SELECT
    r.id,
    r.reporter_id,
    r.lat,
    r.lng,
    r.category,
    r.severity,
    r.is_disability_barrier,
    r.description,
    r.status,
    COALESCE(SUM(CASE WHEN v.action = 'confirm' THEN 1 ELSE 0 END), 0) AS confirm_count,
    COALESCE(SUM(CASE WHEN v.action = 'reject' THEN 1 ELSE 0 END), 0) AS reject_count,
    COALESCE(SUM(CASE WHEN v.action = 'resolve' THEN 1 ELSE 0 END), 0) AS resolve_count,
    r.created_at,
    r.expires_at
  FROM reports r
  LEFT JOIN report_validations v ON v.report_id = r.id
`;

function mapReportRow(row: ReportQueryRow): SidewalkReport {
  return {
    id: row.id,
    reporter_id: row.reporter_id,
    lat: Number(row.lat),
    lng: Number(row.lng),
    category: row.category,
    severity: Number(row.severity),
    is_disability_barrier: Boolean(row.is_disability_barrier),
    description: row.description,
    status: row.status,
    confirm_count: Number(row.confirm_count),
    reject_count: Number(row.reject_count),
    resolve_count: Number(row.resolve_count),
    created_at: new Date(row.created_at).toISOString(),
    expires_at: new Date(row.expires_at).toISOString(),
  };
}

export async function expireStaleReports(client?: PoolClient): Promise<void> {
  const executor = client ?? pool;
  await executor.query(
    `UPDATE reports
     SET status = 'expired'
     WHERE status IN ('pending', 'verified') AND expires_at < NOW()`
  );
}

export async function createReport(
  reporterId: number,
  input: {
    lat: number;
    lng: number;
    category: ReportCategory;
    severity: number;
    is_disability_barrier: boolean;
    description?: string;
  }
): Promise<SidewalkReport> {
  const inserted = await pool.query<ReportQueryRow>(
    `INSERT INTO reports (reporter_id, lat, lng, category, severity, is_disability_barrier, description, status, expires_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, 'pending', NOW() + INTERVAL '7 days')
     RETURNING id, reporter_id, lat, lng, category, severity, is_disability_barrier, description, status, created_at, expires_at`,
    [
      reporterId,
      input.lat,
      input.lng,
      input.category,
      input.severity,
      input.is_disability_barrier,
      input.description ?? null,
    ]
  );

  return mapReportRow({
    ...inserted.rows[0],
    confirm_count: 0,
    reject_count: 0,
    resolve_count: 0,
  });
}

export async function listReports(filters: {
  lat?: number;
  lng?: number;
  radius: number;
  status?: ReportStatus;
}): Promise<SidewalkReport[]> {
  await expireStaleReports();

  const params: unknown[] = [];
  let whereClause = "";
  if (filters.status) {
    params.push(filters.status);
    whereClause = `WHERE r.status = $1`;
  }

  const result = await pool.query<ReportQueryRow>(
    `${REPORT_SELECT_SQL}
     ${whereClause}
     GROUP BY r.id
     ORDER BY r.created_at DESC`,
    params
  );

  let reports = result.rows.map(mapReportRow);

  if (filters.lat !== undefined && filters.lng !== undefined) {
    reports = reports.filter(
      (report) =>
        haversineDistanceMeters(filters.lat!, filters.lng!, report.lat, report.lng) <=
        filters.radius
    );
  }

  return reports;
}

export async function getReportById(
  id: number,
  client?: PoolClient
): Promise<SidewalkReport> {
  const executor = client ?? pool;
  await expireStaleReports(client);

  const result = await executor.query<ReportQueryRow>(
    `${REPORT_SELECT_SQL}
     WHERE r.id = $1
     GROUP BY r.id`,
    [id]
  );

  if (result.rowCount === 0) {
    throw new AppError(404, "REPORT_NOT_FOUND", "Laporan trotoar tidak ditemukan.");
  }

  return mapReportRow(result.rows[0]);
}

export async function validateReport(
  reportId: number,
  validatorId: number,
  action: ValidationAction
): Promise<SidewalkReport> {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await expireStaleReports(client);

    const existing = await client.query<{
      id: number;
      reporter_id: number;
      status: ReportStatus;
    }>("SELECT id, reporter_id, status FROM reports WHERE id = $1 FOR UPDATE", [reportId]);

    if (existing.rowCount === 0) {
      throw new AppError(404, "REPORT_NOT_FOUND", "Laporan trotoar tidak ditemukan.");
    }

    const report = existing.rows[0];
    if (report.reporter_id === validatorId) {
      throw new AppError(
        400,
        "SELF_VALIDATION_FORBIDDEN",
        "Pelapor tidak boleh memvalidasi laporannya sendiri."
      );
    }
    if (report.status === "expired") {
      throw new AppError(400, "REPORT_EXPIRED", "Laporan sudah melewati masa berlaku (TTL).");
    }

    try {
      await client.query(
        `INSERT INTO report_validations (report_id, validator_id, action)
         VALUES ($1, $2, $3)`,
        [reportId, validatorId, action]
      );
    } catch (err: unknown) {
      const pgErr = err as { code?: string };
      if (pgErr.code === "23505") {
        throw new AppError(409, "ALREADY_VALIDATED", "Anda sudah pernah memvalidasi laporan ini.");
      }
      throw err;
    }

    const countsResult = await client.query<{
      confirm_count: string;
      reject_count: string;
      resolve_count: string;
    }>(
      `SELECT
         COALESCE(SUM(CASE WHEN action = 'confirm' THEN 1 ELSE 0 END), 0) AS confirm_count,
         COALESCE(SUM(CASE WHEN action = 'reject' THEN 1 ELSE 0 END), 0) AS reject_count,
         COALESCE(SUM(CASE WHEN action = 'resolve' THEN 1 ELSE 0 END), 0) AS resolve_count
       FROM report_validations
       WHERE report_id = $1`,
      [reportId]
    );

    const confirmCount = Number(countsResult.rows[0].confirm_count);
    const rejectCount = Number(countsResult.rows[0].reject_count);
    const resolveCount = Number(countsResult.rows[0].resolve_count);

    // Apply community consensus rules and update reporter/validator reputation.
    if (report.status === "pending" && confirmCount >= CONSENSUS_THRESHOLD) {
      await client.query("UPDATE reports SET status = 'verified' WHERE id = $1", [reportId]);
      await client.query("UPDATE users SET reputation_score = reputation_score + 10 WHERE id = $1", [
        report.reporter_id,
      ]);
      await client.query("UPDATE users SET reputation_score = reputation_score + 2 WHERE id = $1", [
        validatorId,
      ]);
    } else if (report.status === "pending" && rejectCount >= CONSENSUS_THRESHOLD) {
      await client.query("UPDATE reports SET status = 'rejected' WHERE id = $1", [reportId]);
      await client.query(
        "UPDATE users SET reputation_score = GREATEST(0, reputation_score - 5) WHERE id = $1",
        [report.reporter_id]
      );
    } else if (
      (report.status === "pending" || report.status === "verified") &&
      resolveCount >= CONSENSUS_THRESHOLD
    ) {
      await client.query("UPDATE reports SET status = 'resolved' WHERE id = $1", [reportId]);
      await client.query("UPDATE users SET reputation_score = reputation_score + 2 WHERE id = $1", [
        validatorId,
      ]);
    }

    const updated = await getReportById(reportId, client);
    await client.query("COMMIT");
    return updated;
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}
