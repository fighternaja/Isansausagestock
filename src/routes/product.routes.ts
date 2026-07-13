import { NextFunction, Request, Response, Router } from "express";
import { authenticate, authorize } from "../middleware/auth";
import { validateBody, validateParams } from "../middleware/validate";
import {
    adjustProductStock,
    calculateProductionRequirements,
    createProduct,
    deleteProduct,
    getProduct,
    listProducts,
    updateProduct,
} from "../services/product.service";
import { paramId } from "../utils/params";
import {
    idParamSchema,
    productSchema,
    stockAdjustSchema,
} from "../validators/schemas";

const router = Router();

router.use(authenticate);

router.get("/", async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const products = await listProducts();
    res.json(products);
  } catch (err) {
    next(err);
  }
});

router.get(
  "/:id/preview",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const qty = Number(req.query.quantity) || 1;
      const preview = await calculateProductionRequirements(
        paramId(req.params.id),
        qty
      );
      res.json(preview);
    } catch (err) {
      next(err);
    }
  }
);

router.get(
  "/:id",
  validateParams(idParamSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const product = await getProduct(paramId(req.params.id));
      res.json(product);
    } catch (err) {
      next(err);
    }
  }
);

router.post(
  "/",
  authorize("ADMIN", "STAFF"),
  validateBody(productSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const product = await createProduct(req.body, req.user!.userId);
      res.status(201).json(product);
    } catch (err) {
      next(err);
    }
  }
);

router.put(
  "/:id",
  authorize("ADMIN", "STAFF"),
  validateParams(idParamSchema),
  validateBody(productSchema.partial()),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const product = await updateProduct(
        paramId(req.params.id),
        req.body,
        req.user!.userId
      );
      res.json(product);
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
      await deleteProduct(paramId(req.params.id), req.user!.userId);
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
      const product = await adjustProductStock(
        paramId(req.params.id),
        req.body.quantity,
        req.body.reason,
        req.user!.userId
      );
      res.json(product);
    } catch (err) {
      next(err);
    }
  }
);

export default router;
