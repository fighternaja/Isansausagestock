"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.dashboardQuerySchema = exports.paginationSchema = exports.idParamSchema = exports.stockAdjustSchema = exports.salesOrderSchema = exports.productionSchema = exports.productSchema = exports.productRecipeItemSchema = exports.rawMaterialSchema = exports.loginSchema = exports.registerSchema = void 0;
const zod_1 = require("zod");
exports.registerSchema = zod_1.z.object({
    name: zod_1.z.string().min(2).max(100),
    email: zod_1.z.string().email(),
    password: zod_1.z.string().min(8).max(100),
    role: zod_1.z.enum(["ADMIN", "STAFF"]).optional(),
});
exports.loginSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
    password: zod_1.z.string().min(1),
});
exports.rawMaterialSchema = zod_1.z.object({
    name: zod_1.z.string().min(1).max(200),
    unit: zod_1.z.string().min(1).max(50),
    quantity: zod_1.z.coerce.number().min(0).optional(),
    minStockAlert: zod_1.z.coerce.number().min(0),
    costPerUnit: zod_1.z.coerce.number().min(0),
});
exports.productRecipeItemSchema = zod_1.z.object({
    rawMaterialId: zod_1.z.string().cuid(),
    quantityPerUnit: zod_1.z.coerce.number().positive(),
});
exports.productSchema = zod_1.z.object({
    name: zod_1.z.string().min(1).max(200),
    recipe: zod_1.z.array(exports.productRecipeItemSchema).min(1),
    quantity: zod_1.z.coerce.number().min(0).optional(),
    minStockAlert: zod_1.z.coerce.number().min(0),
    expiryDays: zod_1.z.coerce.number().int().min(1),
});
exports.productionSchema = zod_1.z.object({
    productId: zod_1.z.string().cuid(),
    quantityProduced: zod_1.z.coerce.number().positive(),
});
exports.salesOrderSchema = zod_1.z.object({
    customerName: zod_1.z.string().min(1).max(200),
    items: zod_1.z
        .array(zod_1.z.object({
        productId: zod_1.z.string().cuid(),
        quantity: zod_1.z.coerce.number().positive(),
    }))
        .min(1),
});
exports.stockAdjustSchema = zod_1.z.object({
    itemType: zod_1.z.enum(["RAW_MATERIAL", "PRODUCT"]),
    itemId: zod_1.z.string().cuid(),
    quantity: zod_1.z.coerce.number(),
    reason: zod_1.z.string().min(1).max(500),
});
exports.idParamSchema = zod_1.z.object({
    id: zod_1.z.string().cuid(),
});
exports.paginationSchema = zod_1.z.object({
    page: zod_1.z.coerce.number().int().min(1).default(1),
    limit: zod_1.z.coerce.number().int().min(1).max(100).default(20),
});
exports.dashboardQuerySchema = zod_1.z.object({
    days: zod_1.z.coerce.number().int().min(7).max(365).default(30),
});
//# sourceMappingURL=schemas.js.map