"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listRawMaterials = listRawMaterials;
exports.getRawMaterial = getRawMaterial;
exports.createRawMaterial = createRawMaterial;
exports.updateRawMaterial = updateRawMaterial;
exports.deleteRawMaterial = deleteRawMaterial;
exports.adjustRawMaterialStock = adjustRawMaterialStock;
const prisma_1 = require("../lib/prisma");
const errorHandler_1 = require("../middleware/errorHandler");
const helpers_1 = require("./helpers");
async function listRawMaterials() {
    const materials = await prisma_1.prisma.rawMaterial.findMany({
        orderBy: { name: "asc" },
    });
    return materials.map((m) => ({
        ...m,
        quantity: (0, helpers_1.decimalToNumber)(m.quantity),
        minStockAlert: (0, helpers_1.decimalToNumber)(m.minStockAlert),
        costPerUnit: (0, helpers_1.decimalToNumber)(m.costPerUnit),
        isLowStock: (0, helpers_1.decimalToNumber)(m.quantity) <= (0, helpers_1.decimalToNumber)(m.minStockAlert),
    }));
}
async function getRawMaterial(id) {
    const material = await prisma_1.prisma.rawMaterial.findUnique({ where: { id } });
    if (!material)
        throw new errorHandler_1.AppError(404, "Raw material not found");
    return {
        ...material,
        quantity: (0, helpers_1.decimalToNumber)(material.quantity),
        minStockAlert: (0, helpers_1.decimalToNumber)(material.minStockAlert),
        costPerUnit: (0, helpers_1.decimalToNumber)(material.costPerUnit),
    };
}
async function createRawMaterial(data, userId) {
    const material = await prisma_1.prisma.rawMaterial.create({
        data: {
            name: data.name,
            unit: data.unit,
            quantity: data.quantity ?? 0,
            minStockAlert: data.minStockAlert,
            costPerUnit: data.costPerUnit,
        },
    });
    await (0, helpers_1.createAuditLog)({
        userId,
        action: "CREATE",
        tableName: "RawMaterial",
        recordId: material.id,
        newValue: material,
    });
    if (data.quantity && data.quantity > 0) {
        await (0, helpers_1.createStockMovement)({
            itemType: "RAW_MATERIAL",
            itemId: material.id,
            type: "IN",
            quantity: data.quantity,
            reason: "Initial stock",
            userId,
        });
    }
    await (0, helpers_1.checkLowStockNotifications)();
    return getRawMaterial(material.id);
}
async function updateRawMaterial(id, data, userId) {
    const existing = await prisma_1.prisma.rawMaterial.findUnique({ where: { id } });
    if (!existing)
        throw new errorHandler_1.AppError(404, "Raw material not found");
    const material = await prisma_1.prisma.rawMaterial.update({
        where: { id },
        data,
    });
    await (0, helpers_1.createAuditLog)({
        userId,
        action: "UPDATE",
        tableName: "RawMaterial",
        recordId: id,
        oldValue: existing,
        newValue: material,
    });
    await (0, helpers_1.checkLowStockNotifications)();
    return getRawMaterial(id);
}
async function deleteRawMaterial(id, userId) {
    const existing = await prisma_1.prisma.rawMaterial.findUnique({ where: { id } });
    if (!existing)
        throw new errorHandler_1.AppError(404, "Raw material not found");
    await prisma_1.prisma.rawMaterial.delete({ where: { id } });
    await (0, helpers_1.createAuditLog)({
        userId,
        action: "DELETE",
        tableName: "RawMaterial",
        recordId: id,
        oldValue: existing,
    });
}
async function adjustRawMaterialStock(id, quantity, reason, userId) {
    return prisma_1.prisma.$transaction(async (tx) => {
        const material = await tx.rawMaterial.findUnique({ where: { id } });
        if (!material)
            throw new errorHandler_1.AppError(404, "Raw material not found");
        const newQty = (0, helpers_1.decimalToNumber)(material.quantity) + quantity;
        if (newQty < 0)
            throw new errorHandler_1.AppError(400, "Insufficient stock");
        const updated = await tx.rawMaterial.update({
            where: { id },
            data: { quantity: newQty },
        });
        await tx.stockMovement.create({
            data: {
                itemType: "RAW_MATERIAL",
                itemId: id,
                type: "ADJUST",
                quantity: Math.abs(quantity),
                reason,
                userId,
            },
        });
        await (0, helpers_1.createAuditLog)({
            userId,
            action: "ADJUST_STOCK",
            tableName: "RawMaterial",
            recordId: id,
            oldValue: { quantity: material.quantity },
            newValue: { quantity: updated.quantity },
        });
        return {
            ...updated,
            quantity: (0, helpers_1.decimalToNumber)(updated.quantity),
            minStockAlert: (0, helpers_1.decimalToNumber)(updated.minStockAlert),
            costPerUnit: (0, helpers_1.decimalToNumber)(updated.costPerUnit),
        };
    });
}
//# sourceMappingURL=rawMaterial.service.js.map