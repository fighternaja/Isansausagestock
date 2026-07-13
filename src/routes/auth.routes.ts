import { NextFunction, Request, Response, Router } from "express";
import rateLimit from "express-rate-limit";
import { env } from "../config/env";
import { authenticate, authorize } from "../middleware/auth";
import { validateBody } from "../middleware/validate";
import {
  getUserById,
  loginUser,
  logoutUser,
  refreshAccessToken,
  registerUser,
} from "../services/auth.service";
import { loginSchema, registerSchema } from "../validators/schemas";

const router = Router();

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: "Too many login attempts, please try again later" },
  standardHeaders: true,
  legacyHeaders: false,
});

function setRefreshCookie(res: Response, token: string) {
  res.cookie("refreshToken", token, {
    httpOnly: true,
    secure: env.NODE_ENV === "production",
    sameSite: "none",
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: "/api/auth",
  });
}

function clearRefreshCookie(res: Response) {
  res.clearCookie("refreshToken", {
    path: "/api/auth",
    sameSite: "none",
    secure: env.NODE_ENV === "production",
  });
}

router.post(
  "/register",
  authenticate,
  authorize("ADMIN"),
  validateBody(registerSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = await registerUser(req.body);
      res.status(201).json(user);
    } catch (err) {
      next(err);
    }
  }
);

router.post(
  "/login",
  loginLimiter,
  validateBody(loginSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await loginUser(req.body.email, req.body.password);
      setRefreshCookie(res, result.refreshToken);
      res.json({
        user: result.user,
        accessToken: result.accessToken,
      });
    } catch (err) {
      next(err);
    }
  }
);

router.post(
  "/refresh",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const refreshToken = req.cookies.refreshToken;
      if (!refreshToken) {
        res.status(401).json({ error: "No refresh token" });
        return;
      }
      const result = await refreshAccessToken(refreshToken);
      res.json(result);
    } catch (err) {
      next(err);
    }
  }
);

router.post(
  "/logout",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const refreshToken = req.cookies.refreshToken;
      if (refreshToken) {
        await logoutUser(refreshToken);
      }
      clearRefreshCookie(res);
      res.json({ message: "Logged out" });
    } catch (err) {
      next(err);
    }
  }
);

router.get(
  "/me",
  authenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = await getUserById(req.user!.userId);
      res.json(user);
    } catch (err) {
      next(err);
    }
  }
);

export default router;
