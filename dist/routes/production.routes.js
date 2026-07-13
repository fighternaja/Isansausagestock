"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const validate_1 = require("../middleware/validate");
const production_service_1 = require("../services/production.service");
const schemas_1 = require("../validators/schemas");
const router = (0, express_1.Router)();
router.use(auth_1.authenticate);
router.use((0, auth_1.authorize)("ADMIN", "STAFF"));
router.get("/", (0, validate_1.validateQuery)(schemas_1.paginationSchema), async (req, res, next) => {
    try {
        const { page, limit } = req.query;
        const batches = await (0, production_service_1.listProductionBatches)(page, limit);
        res.json(batches);
    }
    catch (err) {
        next(err);
    }
});
router.get("/preview", async (req, res, next) => {
    try {
        const productId = req.query.productId;
        const quantity = Number(req.query.quantity);
        if (!productId || !quantity) {
            res.status(400).json({ error: "productId and quantity required" });
            return;
        }
        const preview = await (0, production_service_1.getProductionPreview)(productId, quantity);
        res.json(preview);
    }
    catch (err) {
        next(err);
    }
});
router.post("/", (0, validate_1.validateBody)(schemas_1.productionSchema), async (req, res, next) => {
    try {
        const batch = await (0, production_service_1.createProductionBatch)(req.body, req.user.userId);
        res.status(201).json(batch);
    }
    catch (err) {
        next(err);
    }
});
exports.default = router;
//# sourceMappingURL=production.routes.js.map