import { NextFunction, Request, Response, Router } from "express";
import { authenticate, authorize } from "../middleware/auth";
import { validateBody, validateParams } from "../middleware/validate";
import {
    adjustRawMaterialStock,
    createRawMaterial,
    deleteRawMaterial,
    getRawMaterial,
    listRawMaterials,
    updateRawMaterial,
} from "../services/rawMaterial.service";
import { paramId } from "../utils/params";
import {
    idParamSchema,
    rawMaterialSchema,
    stockAdjustSchema,
} from "../validators/schemas";

const router = Router();

router.use(authenticate);

router.get("/", async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const materials = await listRawMaterials();
    res.json(materials);
  } catch (err) {
    next(err);
  }
});

router.get(
  "/:id",
  validateParams(idParamSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const material = await getRawMaterial(paramId(req.params.id));
      res.json(material);
    } catch (err) {
      next(err);
    }
  }
);

router.post(
  "/",
  authorize("ADMIN", "STAFF"),
  validateBody(rawMaterialSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const material = await createRawMaterial(req.body, req.user!.userId);
      res.status(201).json(material);
    } catch (err) {
      next(err);
    }
  }
);

router.put(
  "/:id",
  authorize("ADMIN", "STAFF"),
  validateParams(idParamSchema),
  validateBody(rawMaterialSchema.partial()),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const material = await updateRawMaterial(
        paramId(req.params.id),
        req.body,
        req.user!.userId
      );
      res.json(material);
    } catch (err) {
      next(err);
    }
  }
);

router.delete(
  "/:id",
  authorize("ADMIN"),
  validateParams(idParamSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await deleteRawMaterial(paramId(req.params.id), req.user!.userId);
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  }
);

router.post(
  "/:id/adjust",
  authorize("ADMIN", "STAFF"),
  validateParams(idParamSchema),
  validateBody(stockAdjustSchema.pick({ quantity: true, reason: true })),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const material = await adjustRawMaterialStock(
        paramId(req.params.id),
        req.body.quantity,
        req.body.reason,
        req.user!.userId
      );
      res.json(material);
    } catch (err) {
      next(err);
    }
  }
);

export default router;
