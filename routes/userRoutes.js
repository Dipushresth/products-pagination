import express from "express";
import * as userHandler from "../controller/UserHandler.js";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { roleMiddleware } from "../middleware/roleMiddleware.js";

const router = express.Router();

router.get(
  "/",
  authMiddleware,
  roleMiddleware("admin"),
  userHandler.GetUserData,
);

router.get(
  "/:id",
  authMiddleware,
  roleMiddleware("admin"),
  userHandler.GetUserById,
);

// only admin can create, edit, or delete user accounts directly
router.post(
  "/",
  authMiddleware,
  roleMiddleware("admin"),
  userHandler.PostUsers,
);
router.put(
  "/:id",
  authMiddleware,
  roleMiddleware("admin"),
  userHandler.updateUserById,
);
router.patch(
  "/:id",
  authMiddleware,
  roleMiddleware("admin"),
  userHandler.updateUserById,
);
router.delete(
  "/:id",
  authMiddleware,
  roleMiddleware("admin"),
  userHandler.DeleteUsers,
);

export default router;
