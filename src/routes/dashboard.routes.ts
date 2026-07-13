import { Router, Request, Response, NextFunction } from "express";
import { authenticate, authorize } from "../middleware/auth";
import { validateQuery } from "../middleware/validate";
import { dashboardQuerySchema, paginationSchema } from "../validators/schemas";
import { paramId } from "../utils/params";
import {
  getDashboardStats,
  listAuditLogs,
  listNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  getUnreadNotificationCount,
} from "../services/dashboard.service";

const router = Router();

router.use(authenticate);

router.get(
  "/stats",
  validateQuery(dashboardQuerySchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { days } = req.query as unknown as { days: number };
      const stats = await getDashboardStats(days);
      res.json(stats);
    } catch (err) {
      next(err);
    }
  }
);

router.get(
  "/audit-logs",
  authorize("ADMIN"),
  validateQuery(paginationSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { page, limit } = req.query as unknown as {
        page: number;
        limit: number;
      };
      const logs = await listAuditLogs(page, limit);
      res.json(logs);
    } catch (err) {
      next(err);
    }
  }
);

router.get(
  "/notifications",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const unreadOnly = req.query.unreadOnly === "true";
      const notifications = await listNotifications(
        req.user!.userId,
        unreadOnly
      );
      res.json(notifications);
    } catch (err) {
      next(err);
    }
  }
);

router.get(
  "/notifications/count",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const count = await getUnreadNotificationCount(req.user!.userId);
      res.json({ count });
    } catch (err) {
      next(err);
    }
  }
);

router.patch(
  "/notifications/:id/read",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await markNotificationRead(paramId(req.params.id), req.user!.userId);
      res.json({ message: "Marked as read" });
    } catch (err) {
      next(err);
    }
  }
);

router.patch(
  "/notifications/read-all",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await markAllNotificationsRead(req.user!.userId);
      res.json({ message: "All marked as read" });
    } catch (err) {
      next(err);
    }
  }
);

export default router;
