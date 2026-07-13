"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const validate_1 = require("../middleware/validate");
const schemas_1 = require("../validators/schemas");
const params_1 = require("../utils/params");
const dashboard_service_1 = require("../services/dashboard.service");
const router = (0, express_1.Router)();
router.use(auth_1.authenticate);
router.get("/stats", (0, validate_1.validateQuery)(schemas_1.dashboardQuerySchema), async (req, res, next) => {
    try {
        const { days } = req.query;
        const stats = await (0, dashboard_service_1.getDashboardStats)(days);
        res.json(stats);
    }
    catch (err) {
        next(err);
    }
});
router.get("/audit-logs", (0, auth_1.authorize)("ADMIN"), (0, validate_1.validateQuery)(schemas_1.paginationSchema), async (req, res, next) => {
    try {
        const { page, limit } = req.query;
        const logs = await (0, dashboard_service_1.listAuditLogs)(page, limit);
        res.json(logs);
    }
    catch (err) {
        next(err);
    }
});
router.get("/notifications", async (req, res, next) => {
    try {
        const unreadOnly = req.query.unreadOnly === "true";
        const notifications = await (0, dashboard_service_1.listNotifications)(req.user.userId, unreadOnly);
        res.json(notifications);
    }
    catch (err) {
        next(err);
    }
});
router.get("/notifications/count", async (req, res, next) => {
    try {
        const count = await (0, dashboard_service_1.getUnreadNotificationCount)(req.user.userId);
        res.json({ count });
    }
    catch (err) {
        next(err);
    }
});
router.patch("/notifications/:id/read", async (req, res, next) => {
    try {
        await (0, dashboard_service_1.markNotificationRead)((0, params_1.paramId)(req.params.id), req.user.userId);
        res.json({ message: "Marked as read" });
    }
    catch (err) {
        next(err);
    }
});
router.patch("/notifications/read-all", async (req, res, next) => {
    try {
        await (0, dashboard_service_1.markAllNotificationsRead)(req.user.userId);
        res.json({ message: "All marked as read" });
    }
    catch (err) {
        next(err);
    }
});
exports.default = router;
//# sourceMappingURL=dashboard.routes.js.map