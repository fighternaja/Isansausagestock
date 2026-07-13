"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDashboardStats = getDashboardStats;
exports.listAuditLogs = listAuditLogs;
exports.listNotifications = listNotifications;
exports.markNotificationRead = markNotificationRead;
exports.markAllNotificationsRead = markAllNotificationsRead;
exports.getUnreadNotificationCount = getUnreadNotificationCount;
const prisma_1 = require("../lib/prisma");
const helpers_1 = require("./helpers");
async function getDashboardStats(days = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    const [rawMaterials, products, productionBatches] = await Promise.all([
        prisma_1.prisma.rawMaterial.findMany(),
        prisma_1.prisma.product.findMany(),
        prisma_1.prisma.productionBatch.findMany({
            where: { producedAt: { gte: startDate } },
        }),
    ]);
    const totalRevenue = 0;
    const totalProductionCost = productionBatches.reduce((sum, batch) => sum + (0, helpers_1.decimalToNumber)(batch.totalCost), 0);
    const profit = totalRevenue - totalProductionCost;
    const lowStockMaterials = rawMaterials.filter((material) => (0, helpers_1.decimalToNumber)(material.quantity) <= (0, helpers_1.decimalToNumber)(material.minStockAlert));
    const lowStockProducts = products.filter((product) => (0, helpers_1.decimalToNumber)(product.quantity) <= (0, helpers_1.decimalToNumber)(product.minStockAlert));
    return {
        summary: {
            totalRevenue,
            totalProductionCost,
            profit,
            orderCount: 0,
            batchCount: productionBatches.length,
            lowStockCount: lowStockMaterials.length + lowStockProducts.length,
        },
        dailySales: [],
        monthlySales: [],
        stockOverview: {
            rawMaterials: rawMaterials.map((material) => ({
                id: material.id,
                name: material.name,
                quantity: (0, helpers_1.decimalToNumber)(material.quantity),
                unit: material.unit,
                minStockAlert: (0, helpers_1.decimalToNumber)(material.minStockAlert),
                isLowStock: (0, helpers_1.decimalToNumber)(material.quantity) <= (0, helpers_1.decimalToNumber)(material.minStockAlert),
            })),
            products: products.map((product) => ({
                id: product.id,
                name: product.name,
                quantity: (0, helpers_1.decimalToNumber)(product.quantity),
                minStockAlert: (0, helpers_1.decimalToNumber)(product.minStockAlert),
                isLowStock: (0, helpers_1.decimalToNumber)(product.quantity) <= (0, helpers_1.decimalToNumber)(product.minStockAlert),
            })),
        },
        topSellingProducts: [],
        lowStockAlerts: [
            ...lowStockMaterials.map((material) => ({
                type: "RAW_MATERIAL",
                name: material.name,
                quantity: (0, helpers_1.decimalToNumber)(material.quantity),
                unit: material.unit,
            })),
            ...lowStockProducts.map((product) => ({
                type: "PRODUCT",
                name: product.name,
                quantity: (0, helpers_1.decimalToNumber)(product.quantity),
                unit: "ชิ้น",
            })),
        ],
    };
}
async function listAuditLogs(page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [logs, total] = await Promise.all([
        prisma_1.prisma.auditLog.findMany({
            skip,
            take: limit,
            orderBy: { createdAt: "desc" },
            include: { user: { select: { id: true, name: true, email: true } } },
        }),
        prisma_1.prisma.auditLog.count(),
    ]);
    return { data: logs, total, page, limit };
}
async function listNotifications(userId, unreadOnly = false) {
    return prisma_1.prisma.notification.findMany({
        where: {
            userId,
            ...(unreadOnly ? { read: false } : {}),
        },
        orderBy: { createdAt: "desc" },
        take: 50,
    });
}
async function markNotificationRead(id, userId) {
    return prisma_1.prisma.notification.updateMany({
        where: { id, userId },
        data: { read: true },
    });
}
async function markAllNotificationsRead(userId) {
    return prisma_1.prisma.notification.updateMany({
        where: { userId, read: false },
        data: { read: true },
    });
}
async function getUnreadNotificationCount(userId) {
    return prisma_1.prisma.notification.count({
        where: { userId, read: false },
    });
}
//# sourceMappingURL=dashboard.service.js.map