import express from "express";
import { Refresh, Login, Logout, Register } from "../controller/AuthHandler.js";

const router = express.Router();

router.post("/register", Register);
router.post("/login", Login);
router.post("/refresh", Refresh);
router.post("/logout", Logout);

export default router;
