import { Router } from "express";
import { requireAuth } from "../middlewares/auth.middleware.js";
import { createReview } from "../controllers/review.controller.js";

const reviewRoute = Router();

reviewRoute.post("/", requireAuth, createReview);

export default reviewRoute;
