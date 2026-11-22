import { Router, Request, Response, NextFunction } from "express";
import { requireApiKeyOrJwt, requireJwt } from "../auth/auth.middleware";
import { AppError } from "../../utils/errors";
import {
  createReportSchema,
  listReportsQuerySchema,
  validateReportSchema,
} from "./reporting.schema";
import {
  createReport,
  getReportById,
  listReports,
  validateReport,
} from "./reporting.service";

const router = Router();

function parseReportId(raw: string | string[] | undefined): number {
  const value = Array.isArray(raw) ? raw[0] : raw;
  const id = Number(value);
  if (!Number.isInteger(id) || id <= 0) {
    throw new AppError(400, "INVALID_REPORT_ID", "ID laporan harus berupa bilangan bulat positif.");
  }
  return id;
}

router.post("/", requireJwt, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const body = createReportSchema.parse(req.body);
    const report = await createReport(req.user!.userId, body);
    res.status(201).json(report);
  } catch (err) {
    next(err);
  }
});

router.get("/", requireApiKeyOrJwt, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const query = listReportsQuerySchema.parse(req.query);
    const reports = await listReports(query);
    res.json({ count: reports.length, reports });
  } catch (err) {
    next(err);
  }
});

router.get("/:id", requireApiKeyOrJwt, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = parseReportId(req.params.id);
    const report = await getReportById(id);
    res.json(report);
  } catch (err) {
    next(err);
  }
});

router.post(
  "/:id/validate",
  requireJwt,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = parseReportId(req.params.id);
      const body = validateReportSchema.parse(req.body);
      const updated = await validateReport(id, req.user!.userId, body.action);
      res.json(updated);
    } catch (err) {
      next(err);
    }
  }
);

export const reportingRouter = router;
