import { Router } from "express";
import { requireAuth } from "../middlewares/auth.middleware.js";
import { sendRecommendation } from "../controllers/recommendation.controller.js";

const recommendationRoute = Router();

recommendationRoute.post("/", requireAuth, sendRecommendation);

export default recommendationRoute;
