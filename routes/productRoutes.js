import express from "express";
import * as productHandler from "../controller/ProductHandler.js";
import { roleMiddleware } from "../middleware/roleMiddleware.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", authMiddleware, productHandler.GetProducts);
router.get("/:id", authMiddleware, productHandler.GetProductById);
router.post(
  "/",
  authMiddleware,
  roleMiddleware("admin", "staff"),
  productHandler.PostProducts,
);
router.put(
  "/:id",
  authMiddleware,
  roleMiddleware("admin", "staff"),
  productHandler.updateProductById,
);
router.patch(
  "/:id",
  authMiddleware,
  roleMiddleware("admin", "staff"),
  productHandler.updateProductById,
);
router.delete(
  "/:id",
  authMiddleware,
  roleMiddleware("admin"),
  productHandler.DeleteProducts,
);

export default router;
