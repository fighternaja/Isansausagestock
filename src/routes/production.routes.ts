import { NextFunction, Request, Response, Router } from "express";
import { authenticate, authorize } from "../middleware/auth";
import { validateBody, validateQuery } from "../middleware/validate";
import {
    createProductionBatch,
    getProductionPreview,
    listProductionBatches,
} from "../services/production.service";
import { paginationSchema, productionSchema } from "../validators/schemas";

const router = Router();

router.use(authenticate);
router.use(authorize("ADMIN", "STAFF"));

router.get(
  "/",
  validateQuery(paginationSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { page, limit } = req.query as unknown as {
        page: number;
        limit: number;
      };
      const batches = await listProductionBatches(page, limit);
      res.json(batches);
    } catch (err) {
      next(err);
    }
  }
);

router.get(
  "/preview",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const productId = req.query.productId as string;
      const quantity = Number(req.query.quantity);
      if (!productId || !quantity) {
        res.status(400).json({ error: "productId and quantity required" });
        return;
      }
      const preview = await getProductionPreview(productId, quantity);
      res.json(preview);
    } catch (err) {
      next(err);
    }
  }
);

router.post(
  "/",
  validateBody(productionSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const batch = await createProductionBatch(req.body, req.user!.userId);
      res.status(201).json(batch);
    } catch (err) {
      next(err);
    }
  }
);

export default router;
