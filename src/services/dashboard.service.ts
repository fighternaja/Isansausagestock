import { prisma } from "../lib/prisma";
import { decimalToNumber } from "./helpers";

export async function getDashboardStats(days = 30) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const [rawMaterials, products, productionBatches, stockMovements] = await Promise.all([
    prisma.rawMaterial.findMany(),
    prisma.product.findMany(),
    prisma.productionBatch.findMany({
      where: { producedAt: { gte: startDate } },
    }),
    prisma.stockMovement.findMany({
      where: { createdAt: { gte: startDate } },
      orderBy: { createdAt: "asc" },
    }),
  ]);

  const totalRevenue = 0;
  const totalProductionCost = productionBatches.reduce(
    (sum, batch) => sum + decimalToNumber(batch.totalCost),
    0
  );
  const profit = totalRevenue - totalProductionCost;

  const lowStockMaterials = rawMaterials.filter(
    (material) => decimalToNumber(material.quantity) <= decimalToNumber(material.minStockAlert)
  );
  const lowStockProducts = products.filter(
    (product) => decimalToNumber(product.quantity) <= decimalToNumber(product.minStockAlert)
  );

  const dailySales = stockMovements.reduce<Record<string, number>>((acc, movement) => {
    const key = movement.createdAt.toISOString().slice(0, 10);
    if (movement.type === "OUT") {
      acc[key] = (acc[key] ?? 0) - decimalToNumber(movement.quantity);
    } else if (movement.type === "IN") {
      acc[key] = (acc[key] ?? 0) + decimalToNumber(movement.quantity);
    }
    return acc;
  }, {});

  return {
    summary: {
      totalRevenue,
      totalProductionCost,
      profit,
      orderCount: 0,
      batchCount: productionBatches.length,
      lowStockCount: lowStockMaterials.length + lowStockProducts.length,
    },
    dailySales: Object.entries(dailySales).map(([date, amount]) => ({ date, amount })),
    monthlySales: [],
    stockOverview: {
      rawMaterials: rawMaterials.map((material) => ({
        id: material.id,
        name: material.name,
        quantity: decimalToNumber(material.quantity),
        unit: material.unit,
        minStockAlert: decimalToNumber(material.minStockAlert),
        isLowStock:
          decimalToNumber(material.quantity) <= decimalToNumber(material.minStockAlert),
      })),
      products: products.map((product) => ({
        id: product.id,
        name: product.name,
        quantity: decimalToNumber(product.quantity),
        minStockAlert: decimalToNumber(product.minStockAlert),
        isLowStock:
          decimalToNumber(product.quantity) <= decimalToNumber(product.minStockAlert),
      })),
    },
    topSellingProducts: [],
    lowStockAlerts: [
      ...lowStockMaterials.map((material) => ({
        type: "RAW_MATERIAL" as const,
        name: material.name,
        quantity: decimalToNumber(material.quantity),
        unit: material.unit,
      })),
      ...lowStockProducts.map((product) => ({
        type: "PRODUCT" as const,
        name: product.name,
        quantity: decimalToNumber(product.quantity),
        unit: "ชิ้น",
      })),
    ],
  };
}

export async function listAuditLogs(page = 1, limit = 20) {
  const skip = (page - 1) * limit;
  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: { user: { select: { id: true, name: true, email: true } } },
    }),
    prisma.auditLog.count(),
  ]);

  return { data: logs, total, page, limit };
}

export async function listNotifications(userId: string, unreadOnly = false) {
  return prisma.notification.findMany({
    where: {
      userId,
      ...(unreadOnly ? { read: false } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
}

export async function markNotificationRead(id: string, userId: string) {
  return prisma.notification.updateMany({
    where: { id, userId },
    data: { read: true },
  });
}

export async function markAllNotificationsRead(userId: string) {
  return prisma.notification.updateMany({
    where: { userId, read: false },
    data: { read: true },
  });
}

export async function getUnreadNotificationCount(userId: string) {
  return prisma.notification.count({
    where: { userId, read: false },
  });
}
