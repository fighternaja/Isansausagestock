"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const auth_service_1 = require("../services/auth.service");
const auth_1 = require("../middleware/auth");
const validate_1 = require("../middleware/validate");
const schemas_1 = require("../validators/schemas");
const env_1 = require("../config/env");
const router = (0, express_1.Router)();
const loginLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000,
    max: 10,
    message: { error: "Too many login attempts, please try again later" },
    standardHeaders: true,
    legacyHeaders: false,
});
function setRefreshCookie(res, token) {
    res.cookie("refreshToken", token, {
        httpOnly: true,
        secure: env_1.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 7 * 24 * 60 * 60 * 1000,
        path: "/api/auth",
    });
}
function clearRefreshCookie(res) {
    res.clearCookie("refreshToken", { path: "/api/auth" });
}
router.post("/register", auth_1.authenticate, (0, auth_1.authorize)("ADMIN"), (0, validate_1.validateBody)(schemas_1.registerSchema), async (req, res, next) => {
    try {
        const user = await (0, auth_service_1.registerUser)(req.body);
        res.status(201).json(user);
    }
    catch (err) {
        next(err);
    }
});
router.post("/login", loginLimiter, (0, validate_1.validateBody)(schemas_1.loginSchema), async (req, res, next) => {
    try {
        const result = await (0, auth_service_1.loginUser)(req.body.email, req.body.password);
        setRefreshCookie(res, result.refreshToken);
        res.json({
            user: result.user,
            accessToken: result.accessToken,
        });
    }
    catch (err) {
        next(err);
    }
});
router.post("/refresh", async (req, res, next) => {
    try {
        const refreshToken = req.cookies.refreshToken;
        if (!refreshToken) {
            res.status(401).json({ error: "No refresh token" });
            return;
        }
        const result = await (0, auth_service_1.refreshAccessToken)(refreshToken);
        res.json(result);
    }
    catch (err) {
        next(err);
    }
});
router.post("/logout", async (req, res, next) => {
    try {
        const refreshToken = req.cookies.refreshToken;
        if (refreshToken) {
            await (0, auth_service_1.logoutUser)(refreshToken);
        }
        clearRefreshCookie(res);
        res.json({ message: "Logged out" });
    }
    catch (err) {
        next(err);
    }
});
router.get("/me", auth_1.authenticate, async (req, res, next) => {
    try {
        const user = await (0, auth_service_1.getUserById)(req.user.userId);
        res.json(user);
    }
    catch (err) {
        next(err);
    }
});
exports.default = router;
//# sourceMappingURL=auth.routes.js.map