import { Router } from "express";
import { requireAuth } from "../middlewares/auth.middleware.js";
import { createReview, getReview } from "../controllers/review.controller.js";

const reviewRoute = Router();

reviewRoute.post("/", requireAuth, createReview);
reviewRoute.get("/:movie_id", requireAuth, getReview);

export default reviewRoute;
