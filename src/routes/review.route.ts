import { Router } from "express";
import { optionalAuth, requireAuth } from "../middlewares/auth.middleware.js";
import {
  createReview,
  deleteReview,
  getReview,
  getReviewsByMovie,
  likeReview,
} from "../controllers/review.controller.js";

const reviewRoute = Router();

reviewRoute.post("/", requireAuth, createReview);
reviewRoute.get("/:movie_id", requireAuth, getReview);
reviewRoute.get("/:movie_id/all", optionalAuth, getReviewsByMovie);
reviewRoute.post("/:review_id/like", requireAuth, likeReview);
reviewRoute.delete("/:review_id", requireAuth, deleteReview);

export default reviewRoute;
