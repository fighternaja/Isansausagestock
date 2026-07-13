"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const validate_1 = require("../middleware/validate");
const product_service_1 = require("../services/product.service");
const params_1 = require("../utils/params");
const schemas_1 = require("../validators/schemas");
const router = (0, express_1.Router)();
router.use(auth_1.authenticate);
router.get("/", async (_req, res, next) => {
    try {
        const products = await (0, product_service_1.listProducts)();
        res.json(products);
    }
    catch (err) {
        next(err);
    }
});
router.get("/:id/preview", async (req, res, next) => {
    try {
        const qty = Number(req.query.quantity) || 1;
        const preview = await (0, product_service_1.calculateProductionRequirements)((0, params_1.paramId)(req.params.id), qty);
        res.json(preview);
    }
    catch (err) {
        next(err);
    }
});
router.get("/:id", (0, validate_1.validateParams)(schemas_1.idParamSchema), async (req, res, next) => {
    try {
        const product = await (0, product_service_1.getProduct)((0, params_1.paramId)(req.params.id));
        res.json(product);
    }
    catch (err) {
        next(err);
    }
});
router.post("/", (0, auth_1.authorize)("ADMIN", "STAFF"), (0, validate_1.validateBody)(schemas_1.productSchema), async (req, res, next) => {
    try {
        const product = await (0, product_service_1.createProduct)(req.body, req.user.userId);
        res.status(201).json(product);
    }
    catch (err) {
        next(err);
    }
});
router.put("/:id", (0, auth_1.authorize)("ADMIN", "STAFF"), (0, validate_1.validateParams)(schemas_1.idParamSchema), (0, validate_1.validateBody)(schemas_1.productSchema.partial()), async (req, res, next) => {
    try {
        const product = await (0, product_service_1.updateProduct)((0, params_1.paramId)(req.params.id), req.body, req.user.userId);
        res.json(product);
    }
    catch (err) {
        next(err);
    }
});
router.delete("/:id", (0, auth_1.authorize)("ADMIN"), (0, validate_1.validateParams)(schemas_1.idParamSchema), async (req, res, next) => {
    try {
        await (0, product_service_1.deleteProduct)((0, params_1.paramId)(req.params.id), req.user.userId);
        res.status(204).send();
    }
    catch (err) {
        next(err);
    }
});
router.post("/:id/adjust", (0, auth_1.authorize)("ADMIN", "STAFF"), (0, validate_1.validateParams)(schemas_1.idParamSchema), (0, validate_1.validateBody)(schemas_1.stockAdjustSchema.pick({ quantity: true, reason: true })), async (req, res, next) => {
    try {
        const product = await (0, product_service_1.adjustProductStock)((0, params_1.paramId)(req.params.id), req.body.quantity, req.body.reason, req.user.userId);
        res.json(product);
    }
    catch (err) {
        next(err);
    }
});
exports.default = router;
//# sourceMappingURL=product.routes.js.map