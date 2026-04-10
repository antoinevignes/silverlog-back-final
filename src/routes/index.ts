import { Router } from "express";
import userRoute from "./user.route.js";
import authRoute from "./auth.route.js";
import followRoute from "./follow.route.js";
import tmdbRoute from "./tmdb.route.js";
import movieRoute from "./movie.route.js";
import userMovieRoute from "./user-movie.route.js";
import reviewRoute from "./review.route.js";
import reviewRoute from "./review.route.js";
import sql from "../db.js";
import listRoute from "./list.route.js";
import adminRoute from "./admin.route.js";
import notificationRoute from "./notification.route.js";
import recommendationRoute from "./recommendation.route.js";

const router = Router();

router.use("/movies", movieRoute);
router.use("/auth", authRoute);
router.use("/user", followRoute);
router.use("/user", userRoute);
router.use("/tmdb", tmdbRoute);
router.use("/user_movie", userMovieRoute);
router.use("/reviews", reviewRoute);
router.use("/lists", listRoute);
router.use("/admin", adminRoute);
router.use("/notifications", notificationRoute);
router.use("/recommendation", recommendationRoute);

router.get("/health", async (req, res) => {
  try {
    await sql`SELECT 1`;
    res.status(200).send("OK");
  } catch (err) {
    res.status(500).send("DB Error");
  }
});
export default router;
