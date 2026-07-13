"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseRecipe = parseRecipe;
exports.createAuditLog = createAuditLog;
exports.createStockMovement = createStockMovement;
exports.notifyAdmins = notifyAdmins;
exports.checkLowStockNotifications = checkLowStockNotifications;
exports.decimalToNumber = decimalToNumber;
const prisma_1 = require("../lib/prisma");
function parseRecipe(recipe) {
    if (!Array.isArray(recipe))
        return [];
    return recipe;
}
async function createAuditLog(params) {
    await prisma_1.prisma.auditLog.create({
        data: {
            userId: params.userId,
            action: params.action,
            tableName: params.tableName,
            recordId: params.recordId,
            oldValue: params.oldValue,
            newValue: params.newValue,
        },
    });
}
async function createStockMovement(params) {
    await prisma_1.prisma.stockMovement.create({
        data: {
            itemType: params.itemType,
            itemId: params.itemId,
            type: params.type,
            quantity: params.quantity,
            reason: params.reason,
            userId: params.userId,
        },
    });
}
async function notifyAdmins(title, message, type) {
    const admins = await prisma_1.prisma.user.findMany({
        where: { role: "ADMIN" },
        select: { id: true },
    });
    if (admins.length === 0)
        return;
    await prisma_1.prisma.notification.createMany({
        data: admins.map((admin) => ({
            userId: admin.id,
            title,
            message,
            type,
        })),
    });
}
async function checkLowStockNotifications() {
    const materials = await prisma_1.prisma.rawMaterial.findMany();
    const lowMaterials = materials.filter((m) => decimalToNumber(m.quantity) <= decimalToNumber(m.minStockAlert));
    for (const material of lowMaterials) {
        await notifyAdmins("สต็อกวัตถุดิบต่ำ", `${material.name} เหลือ ${material.quantity} ${material.unit} (ต่ำกว่า ${material.minStockAlert})`, "LOW_STOCK_RAW");
    }
    const products = await prisma_1.prisma.product.findMany();
    const lowProducts = products.filter((p) => decimalToNumber(p.quantity) <= decimalToNumber(p.minStockAlert));
    for (const product of lowProducts) {
        await notifyAdmins("สต็อกสินค้าต่ำ", `${product.name} เหลือ ${product.quantity} ชิ้น (ต่ำกว่า ${product.minStockAlert})`, "LOW_STOCK_PRODUCT");
    }
}
function decimalToNumber(value) {
    return typeof value === "number" ? value : Number(value);
}
//# sourceMappingURL=helpers.js.map