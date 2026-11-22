import { Router, Request, Response, NextFunction } from "express";
import { z } from "zod";
import { requireApiKeyOrJwt } from "../auth/auth.middleware";
import { calculateWalkability, summarizeAreaInsight } from "./walkability.service";

const router = Router();

const areaQuerySchema = z.object({
  lat: z.coerce.number().min(-90).max(90),
  lng: z.coerce.number().min(-180).max(180),
  radius: z.coerce.number().int().min(50).max(5000).default(500),
});

router.get(
  "/walkability",
  requireApiKeyOrJwt,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const query = areaQuerySchema.parse(req.query);
      const result = await calculateWalkability(query);
      res.json(result);
    } catch (err) {
      next(err);
    }
  }
);

router.get(
  "/insights",
  requireApiKeyOrJwt,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const query = areaQuerySchema.parse(req.query);
      const result = await summarizeAreaInsight(query);
      res.json(result);
    } catch (err) {
      next(err);
    }
  }
);

export const walkabilityRouter = router;
