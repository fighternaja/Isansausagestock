"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerUser = registerUser;
exports.loginUser = loginUser;
exports.refreshAccessToken = refreshAccessToken;
exports.logoutUser = logoutUser;
exports.getUserById = getUserById;
exports.listUsers = listUsers;
const prisma_1 = require("../lib/prisma");
const errorHandler_1 = require("../middleware/errorHandler");
const jwt_1 = require("../utils/jwt");
const password_1 = require("../utils/password");
const userSelect = {
    id: true,
    name: true,
    email: true,
    role: true,
    createdAt: true,
};
async function registerUser(data) {
    const existing = await prisma_1.prisma.user.findUnique({
        where: { email: data.email },
    });
    if (existing) {
        throw new errorHandler_1.AppError(409, "Email already registered");
    }
    const passwordHash = await (0, password_1.hashPassword)(data.password);
    const user = await prisma_1.prisma.user.create({
        data: {
            name: data.name,
            email: data.email,
            passwordHash,
            role: data.role ?? "STAFF",
        },
        select: userSelect,
    });
    return user;
}
async function loginUser(email, password) {
    const user = await prisma_1.prisma.user.findUnique({ where: { email } });
    if (!user) {
        throw new errorHandler_1.AppError(401, "Invalid email or password");
    }
    const valid = await (0, password_1.comparePassword)(password, user.passwordHash);
    if (!valid) {
        throw new errorHandler_1.AppError(401, "Invalid email or password");
    }
    const payload = { userId: user.id, email: user.email, role: user.role };
    const accessToken = (0, jwt_1.signAccessToken)(payload);
    const refreshToken = (0, jwt_1.signRefreshToken)(payload);
    await prisma_1.prisma.refreshToken.create({
        data: {
            token: refreshToken,
            userId: user.id,
            expiresAt: (0, jwt_1.getRefreshTokenExpiry)(),
        },
    });
    return {
        user: {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            createdAt: user.createdAt,
        },
        accessToken,
        refreshToken,
    };
}
async function refreshAccessToken(refreshToken) {
    let payload;
    try {
        payload = (0, jwt_1.verifyRefreshToken)(refreshToken);
    }
    catch {
        throw new errorHandler_1.AppError(401, "Invalid refresh token");
    }
    const stored = await prisma_1.prisma.refreshToken.findUnique({
        where: { token: refreshToken },
    });
    if (!stored || stored.expiresAt < new Date()) {
        throw new errorHandler_1.AppError(401, "Refresh token expired");
    }
    const accessToken = (0, jwt_1.signAccessToken)(payload);
    return { accessToken };
}
async function logoutUser(refreshToken) {
    await prisma_1.prisma.refreshToken.deleteMany({ where: { token: refreshToken } });
}
async function getUserById(id) {
    const user = await prisma_1.prisma.user.findUnique({
        where: { id },
        select: userSelect,
    });
    if (!user)
        throw new errorHandler_1.AppError(404, "User not found");
    return user;
}
async function listUsers() {
    return prisma_1.prisma.user.findMany({
        select: userSelect,
        orderBy: { createdAt: "desc" },
    });
}
//# sourceMappingURL=auth.service.js.map