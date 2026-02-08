import { Router } from "express";
import userRoute from "./user.route.js";
import tmdbRoute from "./tmdb.route.js";
import movieRoute from "./movie.route.js";
import userMovieRoute from "./user-movie.route.js";
import sql from "../db.js";

const router = Router();

router.use("/movies", movieRoute);
router.use("/user", userRoute);
router.use("/tmdb", tmdbRoute);
router.use("/user_movie", userMovieRoute);
router.get("/health", async (req, res) => {
  try {
    await sql`SELECT 1`;
    res.status(200).send("OK");
  } catch (err) {
    res.status(500).send("DB Error");
  }
});
export default router;
