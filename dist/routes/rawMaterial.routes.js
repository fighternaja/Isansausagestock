"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const validate_1 = require("../middleware/validate");
const rawMaterial_service_1 = require("../services/rawMaterial.service");
const params_1 = require("../utils/params");
const schemas_1 = require("../validators/schemas");
const router = (0, express_1.Router)();
router.use(auth_1.authenticate);
router.get("/", async (_req, res, next) => {
    try {
        const materials = await (0, rawMaterial_service_1.listRawMaterials)();
        res.json(materials);
    }
    catch (err) {
        next(err);
    }
});
router.get("/:id", (0, validate_1.validateParams)(schemas_1.idParamSchema), async (req, res, next) => {
    try {
        const material = await (0, rawMaterial_service_1.getRawMaterial)((0, params_1.paramId)(req.params.id));
        res.json(material);
    }
    catch (err) {
        next(err);
    }
});
router.post("/", (0, auth_1.authorize)("ADMIN", "STAFF"), (0, validate_1.validateBody)(schemas_1.rawMaterialSchema), async (req, res, next) => {
    try {
        const material = await (0, rawMaterial_service_1.createRawMaterial)(req.body, req.user.userId);
        res.status(201).json(material);
    }
    catch (err) {
        next(err);
    }
});
router.put("/:id", (0, auth_1.authorize)("ADMIN", "STAFF"), (0, validate_1.validateParams)(schemas_1.idParamSchema), (0, validate_1.validateBody)(schemas_1.rawMaterialSchema.partial()), async (req, res, next) => {
    try {
        const material = await (0, rawMaterial_service_1.updateRawMaterial)((0, params_1.paramId)(req.params.id), req.body, req.user.userId);
        res.json(material);
    }
    catch (err) {
        next(err);
    }
});
router.delete("/:id", (0, auth_1.authorize)("ADMIN"), (0, validate_1.validateParams)(schemas_1.idParamSchema), async (req, res, next) => {
    try {
        await (0, rawMaterial_service_1.deleteRawMaterial)((0, params_1.paramId)(req.params.id), req.user.userId);
        res.status(204).send();
    }
    catch (err) {
        next(err);
    }
});
router.post("/:id/adjust", (0, auth_1.authorize)("ADMIN", "STAFF"), (0, validate_1.validateParams)(schemas_1.idParamSchema), (0, validate_1.validateBody)(schemas_1.stockAdjustSchema.pick({ quantity: true, reason: true })), async (req, res, next) => {
    try {
        const material = await (0, rawMaterial_service_1.adjustRawMaterialStock)((0, params_1.paramId)(req.params.id), req.body.quantity, req.body.reason, req.user.userId);
        res.json(material);
    }
    catch (err) {
        next(err);
    }
});
exports.default = router;
//# sourceMappingURL=rawMaterial.routes.js.map