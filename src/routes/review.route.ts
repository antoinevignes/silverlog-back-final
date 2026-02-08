import { Router } from "express";
import { optionalAuth, requireAuth } from "../middlewares/auth.middleware.js";
import {
  createReview,
  getReview,
  getReviewsByMovie,
} from "../controllers/review.controller.js";

const reviewRoute = Router();

reviewRoute.post("/", requireAuth, createReview);
reviewRoute.get("/:movie_id", requireAuth, getReview);
reviewRoute.get("/:movie_id/all", optionalAuth, getReviewsByMovie);

export default reviewRoute;
