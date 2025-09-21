import { Router } from "express";
import { DashboardController } from "../controllers/dashboard.controller.js";
import { authMiddleware, companyMiddleware } from "../middleware/auth.js";

const router = Router();

// GET /dashboard/stats
router.get(
  "/stats",
  authMiddleware,
  companyMiddleware,
  DashboardController.getStats
);

// GET /dashboard/activity
router.get(
  "/activity",
  authMiddleware,
  companyMiddleware,
  DashboardController.getDeviceActivity
);

// GET /dashboard/alerts
router.get(
  "/alerts",
  authMiddleware,
  companyMiddleware,
  DashboardController.getAlertsSummary
);

// GET /dashboard/top-devices
router.get(
  "/top-devices",
  authMiddleware,
  companyMiddleware,
  DashboardController.getTopDevices
);

export default router;
