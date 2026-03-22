import { Router } from "express";
import { requireAuth, requireAdmin } from "../middlewares/auth.middleware.js";
import {
  getStats,
  getUsers,
  updateUserRole,
  deleteUser,
  getReviews,
  deleteReview,
} from "../controllers/admin.controller.js";

const adminRoute = Router();

adminRoute.use(requireAuth, requireAdmin);

adminRoute.get("/stats", getStats);

adminRoute.get("/users", getUsers);
adminRoute.patch("/users/:userId/role", updateUserRole);
adminRoute.delete("/users/:userId", deleteUser);

adminRoute.get("/reviews", getReviews);
adminRoute.delete("/reviews/:reviewId", deleteReview);

export default adminRoute;
