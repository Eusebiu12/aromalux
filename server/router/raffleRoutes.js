import express from "express";
import {
  createRaffle,
  fetchAllRaffles,
  fetchRaffleDetails,
  updateRaffle,
  deleteRaffle,
} from "../controllers/raffleController.js";

import {
  authorizedRoles,
  isAuthenticated,
} from "../middlewares/authMiddleware.js";

const router = express.Router();

/**
 * Admin: Create a new raffle
 */
router.post(
  "/admin/create",
  isAuthenticated,
  authorizedRoles("Admin"),
  createRaffle
);

/**
 * Public: Get all raffles with pagination
 */
router.get("/", fetchAllRaffles);

/**
 * Public: Get single raffle details
 */
router.get("/single/:raffleId", fetchRaffleDetails);

/**
 * Admin: Update raffle
 */
router.put(
  "/admin/update/:raffleId",
  isAuthenticated,
  authorizedRoles("Admin"),
  updateRaffle
);

/**
 * Admin: Delete raffle
 */
router.delete(
  "/admin/delete/:raffleId",
  isAuthenticated,
  authorizedRoles("Admin"),
  deleteRaffle
);

export default router;
