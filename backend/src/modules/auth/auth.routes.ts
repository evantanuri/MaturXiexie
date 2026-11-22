import { Router, Request, Response, NextFunction } from "express";
import { z } from "zod";
import { requireJwt } from "./auth.middleware";
import { getUserProfile, loginUser, registerUser } from "./auth.service";

const router = Router();

const registerSchema = z.object({
  name: z.string().trim().min(2).max(100),
  email: z.string().trim().email().max(150),
  password: z.string().min(6).max(100),
});

const loginSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(1),
});

router.post("/register", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const body = registerSchema.parse(req.body);
    const result = await registerUser(body);
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
});

router.post("/login", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const body = loginSchema.parse(req.body);
    const result = await loginUser(body);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

router.get("/me", requireJwt, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const profile = await getUserProfile(req.user!.userId);
    res.json(profile);
  } catch (err) {
    next(err);
  }
});

export const authRouter = router;
