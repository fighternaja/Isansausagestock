"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createProductionBatch = createProductionBatch;
exports.listProductionBatches = listProductionBatches;
exports.getProductionPreview = getProductionPreview;
const prisma_1 = require("../lib/prisma");
const errorHandler_1 = require("../middleware/errorHandler");
const helpers_1 = require("./helpers");
const product_service_1 = require("./product.service");
async function createProductionBatch(data, userId) {
    const preview = await (0, product_service_1.calculateProductionRequirements)(data.productId, data.quantityProduced);
    if (!preview.allSufficient) {
        throw new errorHandler_1.AppError(400, "Insufficient raw materials: " +
            preview.requirements
                .filter((r) => !r.sufficient)
                .map((r) => r.rawMaterialName)
                .join(", "));
    }
    return prisma_1.prisma.$transaction(async (tx) => {
        const product = await tx.product.findUnique({
            where: { id: data.productId },
        });
        if (!product)
            throw new errorHandler_1.AppError(404, "Product not found");
        const recipe = (0, helpers_1.parseRecipe)(product.recipe);
        let totalCost = 0;
        const materialEntries = [];
        for (const item of recipe) {
            const requiredQty = item.quantityPerUnit * data.quantityProduced;
            const material = await tx.rawMaterial.findUnique({
                where: { id: item.rawMaterialId },
            });
            if (!material)
                throw new errorHandler_1.AppError(400, "Recipe material not found");
            const available = (0, helpers_1.decimalToNumber)(material.quantity);
            if (available < requiredQty) {
                throw new errorHandler_1.AppError(400, `Insufficient ${material.name}`);
            }
            const costAtTime = (0, helpers_1.decimalToNumber)(material.costPerUnit);
            totalCost += requiredQty * costAtTime;
            await tx.rawMaterial.update({
                where: { id: item.rawMaterialId },
                data: { quantity: available - requiredQty },
            });
            await tx.stockMovement.create({
                data: {
                    itemType: "RAW_MATERIAL",
                    itemId: item.rawMaterialId,
                    type: "OUT",
                    quantity: requiredQty,
                    reason: `Production batch for ${product.name}`,
                    userId,
                },
            });
            materialEntries.push({
                rawMaterialId: item.rawMaterialId,
                quantityUsed: requiredQty,
                costAtTime,
            });
        }
        const updatedProduct = await tx.product.update({
            where: { id: data.productId },
            data: {
                quantity: (0, helpers_1.decimalToNumber)(product.quantity) + data.quantityProduced,
            },
        });
        const batch = await tx.productionBatch.create({
            data: {
                productId: data.productId,
                quantityProduced: data.quantityProduced,
                totalCost,
                costPerUnit: data.quantityProduced > 0 ? totalCost / data.quantityProduced : 0,
                userId,
                materials: {
                    create: materialEntries.map((item) => ({
                        rawMaterialId: item.rawMaterialId,
                        quantityUsed: item.quantityUsed,
                        costAtTime: item.costAtTime,
                    })),
                },
            },
            include: {
                product: true,
                user: { select: { id: true, name: true } },
                materials: { include: { rawMaterial: true } },
            },
        });
        await tx.stockMovement.create({
            data: {
                itemType: "PRODUCT",
                itemId: data.productId,
                type: "IN",
                quantity: data.quantityProduced,
                reason: "Production batch",
                userId,
            },
        });
        await (0, helpers_1.createAuditLog)({
            userId,
            action: "CREATE",
            tableName: "ProductionBatch",
            recordId: batch.id,
            newValue: batch,
        });
        await (0, helpers_1.checkLowStockNotifications)();
        return {
            ...batch,
            quantityProduced: (0, helpers_1.decimalToNumber)(batch.quantityProduced),
            totalCost: (0, helpers_1.decimalToNumber)(batch.totalCost),
            costPerUnit: (0, helpers_1.decimalToNumber)(batch.costPerUnit),
            product: {
                ...batch.product,
                quantity: (0, helpers_1.decimalToNumber)(updatedProduct.quantity),
            },
        };
    });
}
async function listProductionBatches(page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [batches, total] = await Promise.all([
        prisma_1.prisma.productionBatch.findMany({
            skip,
            take: limit,
            orderBy: { producedAt: "desc" },
            include: {
                product: true,
                user: { select: { id: true, name: true } },
                materials: { include: { rawMaterial: true } },
            },
        }),
        prisma_1.prisma.productionBatch.count(),
    ]);
    return {
        data: batches.map((b) => ({
            ...b,
            quantityProduced: (0, helpers_1.decimalToNumber)(b.quantityProduced),
            totalCost: (0, helpers_1.decimalToNumber)(b.totalCost),
            costPerUnit: (0, helpers_1.decimalToNumber)(b.costPerUnit),
            product: {
                ...b.product,
                quantity: (0, helpers_1.decimalToNumber)(b.product.quantity),
            },
        })),
        total,
        page,
        limit,
    };
}
async function getProductionPreview(productId, quantityProduced) {
    return (0, product_service_1.calculateProductionRequirements)(productId, quantityProduced);
}
//# sourceMappingURL=production.service.js.map