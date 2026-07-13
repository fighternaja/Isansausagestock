"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listProducts = listProducts;
exports.getProduct = getProduct;
exports.createProduct = createProduct;
exports.updateProduct = updateProduct;
exports.deleteProduct = deleteProduct;
exports.calculateProductionRequirements = calculateProductionRequirements;
exports.adjustProductStock = adjustProductStock;
const prisma_1 = require("../lib/prisma");
const errorHandler_1 = require("../middleware/errorHandler");
const helpers_1 = require("./helpers");
async function validateRecipe(recipe) {
    const ids = recipe.map((r) => r.rawMaterialId);
    const materials = await prisma_1.prisma.rawMaterial.findMany({
        where: { id: { in: ids } },
    });
    if (materials.length !== ids.length) {
        throw new errorHandler_1.AppError(400, "Invalid raw material in recipe");
    }
}
async function listProducts() {
    const products = await prisma_1.prisma.product.findMany({
        orderBy: { name: "asc" },
    });
    const materialIds = new Set();
    products.forEach((p) => {
        (0, helpers_1.parseRecipe)(p.recipe).forEach((r) => materialIds.add(r.rawMaterialId));
    });
    const materials = await prisma_1.prisma.rawMaterial.findMany({
        where: { id: { in: [...materialIds] } },
    });
    const materialMap = new Map(materials.map((m) => [m.id, m]));
    return products.map((p) => {
        const recipe = (0, helpers_1.parseRecipe)(p.recipe).map((r) => ({
            ...r,
            rawMaterialName: materialMap.get(r.rawMaterialId)?.name ?? "Unknown",
            unit: materialMap.get(r.rawMaterialId)?.unit ?? "",
        }));
        return {
            ...p,
            recipe,
            quantity: (0, helpers_1.decimalToNumber)(p.quantity),
            minStockAlert: (0, helpers_1.decimalToNumber)(p.minStockAlert),
            isLowStock: (0, helpers_1.decimalToNumber)(p.quantity) <= (0, helpers_1.decimalToNumber)(p.minStockAlert),
        };
    });
}
async function getProduct(id) {
    const product = await prisma_1.prisma.product.findUnique({ where: { id } });
    if (!product)
        throw new errorHandler_1.AppError(404, "Product not found");
    const recipe = (0, helpers_1.parseRecipe)(product.recipe);
    const materials = await prisma_1.prisma.rawMaterial.findMany({
        where: { id: { in: recipe.map((r) => r.rawMaterialId) } },
    });
    const materialMap = new Map(materials.map((m) => [m.id, m]));
    return {
        ...product,
        recipe: recipe.map((r) => ({
            ...r,
            rawMaterialName: materialMap.get(r.rawMaterialId)?.name ?? "Unknown",
            unit: materialMap.get(r.rawMaterialId)?.unit ?? "",
        })),
        quantity: (0, helpers_1.decimalToNumber)(product.quantity),
        minStockAlert: (0, helpers_1.decimalToNumber)(product.minStockAlert),
    };
}
async function createProduct(data, userId) {
    await validateRecipe(data.recipe);
    const product = await prisma_1.prisma.product.create({
        data: {
            name: data.name,
            recipe: data.recipe,
            quantity: data.quantity ?? 0,
            minStockAlert: data.minStockAlert,
            expiryDays: data.expiryDays,
        },
    });
    await (0, helpers_1.createAuditLog)({
        userId,
        action: "CREATE",
        tableName: "Product",
        recordId: product.id,
        newValue: product,
    });
    if (data.quantity && data.quantity > 0) {
        await (0, helpers_1.createStockMovement)({
            itemType: "PRODUCT",
            itemId: product.id,
            type: "IN",
            quantity: data.quantity,
            reason: "Initial stock",
            userId,
        });
    }
    await (0, helpers_1.checkLowStockNotifications)();
    return getProduct(product.id);
}
async function updateProduct(id, data, userId) {
    const existing = await prisma_1.prisma.product.findUnique({ where: { id } });
    if (!existing)
        throw new errorHandler_1.AppError(404, "Product not found");
    if (data.recipe)
        await validateRecipe(data.recipe);
    const updateData = {
        name: data.name,
        minStockAlert: data.minStockAlert,
        expiryDays: data.expiryDays,
    };
    if (data.recipe) {
        updateData.recipe = data.recipe;
    }
    const product = await prisma_1.prisma.product.update({
        where: { id },
        data: updateData,
    });
    await (0, helpers_1.createAuditLog)({
        userId,
        action: "UPDATE",
        tableName: "Product",
        recordId: id,
        oldValue: existing,
        newValue: product,
    });
    await (0, helpers_1.checkLowStockNotifications)();
    return getProduct(id);
}
async function deleteProduct(id, userId) {
    const existing = await prisma_1.prisma.product.findUnique({ where: { id } });
    if (!existing)
        throw new errorHandler_1.AppError(404, "Product not found");
    await prisma_1.prisma.product.delete({ where: { id } });
    await (0, helpers_1.createAuditLog)({
        userId,
        action: "DELETE",
        tableName: "Product",
        recordId: id,
        oldValue: existing,
    });
}
async function calculateProductionRequirements(productId, quantityProduced) {
    const product = await prisma_1.prisma.product.findUnique({ where: { id: productId } });
    if (!product)
        throw new errorHandler_1.AppError(404, "Product not found");
    const recipe = (0, helpers_1.parseRecipe)(product.recipe);
    const materialIds = recipe.map((r) => r.rawMaterialId);
    const materials = await prisma_1.prisma.rawMaterial.findMany({
        where: { id: { in: materialIds } },
    });
    const materialMap = new Map(materials.map((m) => [m.id, m]));
    let totalCost = 0;
    const requirements = recipe.map((item) => {
        const material = materialMap.get(item.rawMaterialId);
        if (!material)
            throw new errorHandler_1.AppError(400, "Recipe material not found");
        const requiredQty = item.quantityPerUnit * quantityProduced;
        const available = (0, helpers_1.decimalToNumber)(material.quantity);
        const cost = requiredQty * (0, helpers_1.decimalToNumber)(material.costPerUnit);
        totalCost += cost;
        return {
            rawMaterialId: item.rawMaterialId,
            rawMaterialName: material.name,
            unit: material.unit,
            quantityRequired: requiredQty,
            quantityAvailable: available,
            sufficient: available >= requiredQty,
            cost,
        };
    });
    const allSufficient = requirements.every((r) => r.sufficient);
    const costPerUnit = quantityProduced > 0 ? totalCost / quantityProduced : 0;
    return {
        productId,
        productName: product.name,
        quantityProduced,
        requirements,
        totalCost,
        costPerUnit,
        allSufficient,
    };
}
async function adjustProductStock(id, quantity, reason, userId) {
    return prisma_1.prisma.$transaction(async (tx) => {
        const product = await tx.product.findUnique({ where: { id } });
        if (!product)
            throw new errorHandler_1.AppError(404, "Product not found");
        const newQty = (0, helpers_1.decimalToNumber)(product.quantity) + quantity;
        if (newQty < 0)
            throw new errorHandler_1.AppError(400, "Insufficient stock");
        const updated = await tx.product.update({
            where: { id },
            data: { quantity: newQty },
        });
        await tx.stockMovement.create({
            data: {
                itemType: "PRODUCT",
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
            tableName: "Product",
            recordId: id,
            oldValue: { quantity: product.quantity },
            newValue: { quantity: updated.quantity },
        });
        return {
            ...updated,
            quantity: (0, helpers_1.decimalToNumber)(updated.quantity),
            minStockAlert: (0, helpers_1.decimalToNumber)(updated.minStockAlert),
        };
    });
}
//# sourceMappingURL=product.service.js.map