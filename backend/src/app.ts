import fs from "fs";
import path from "path";
import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import helmet from "helmet";
import swaggerUi from "swagger-ui-express";
import YAML from "yaml";
import { ZodError } from "zod";
import { checkDatabaseHealth } from "./config/database";
import { authRouter } from "./modules/auth/auth.routes";
import { reportingRouter } from "./modules/reporting/reporting.routes";
import { walkabilityRouter } from "./modules/walkability/walkability.routes";
import { AppError } from "./utils/errors";

export function createApp() {
  const app = express();

  app.use(helmet());
  app.use(cors());
  app.use(express.json());

  const openApiPath = path.resolve(__dirname, "../openapi.yaml");
  const openApiDocument = YAML.parse(fs.readFileSync(openApiPath, "utf8"));
  app.use(["/docs", "/api/docs"], swaggerUi.serve, swaggerUi.setup(openApiDocument));

  app.get("/api/health", async (_req: Request, res: Response) => {
    const dbOk = await checkDatabaseHealth();
    res.status(dbOk ? 200 : 503).json({
      status: dbOk ? "ok" : "degraded",
      service: "stepsafe-core",
      database: dbOk ? "connected" : "disconnected",
      timestamp: new Date().toISOString(),
    });
  });

  app.use("/api/auth", authRouter);
  app.use("/api/reports", reportingRouter);
  app.use("/api", walkabilityRouter);

  app.use((_req: Request, res: Response) => {
    res.status(404).json({
      error: "NOT_FOUND",
      message: "Endpoint tidak ditemukan.",
    });
  });

  app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
    if (err instanceof AppError) {
      res.status(err.statusCode).json({
        error: err.code,
        message: err.message,
      });
      return;
    }

    if (err instanceof ZodError) {
      const details = err.issues
        .map((issue) => `${issue.path.join(".") || "input"}: ${issue.message}`)
        .join("; ");
      res.status(400).json({
        error: "VALIDATION_ERROR",
        message: details,
      });
      return;
    }

    console.error(err);
    res.status(500).json({
      error: "INTERNAL_SERVER_ERROR",
      message: "Terjadi kesalahan pada server.",
    });
  });

  return app;
}
