import { Router } from "express";
import userRoute from "./user.route.js";
import tmdbRoute from "./tmdb.route.js";
import movieRoute from "./movie.route.js";
import userMovieRoute from "./user-movie.route.js";

const router = Router();

router.use("/movies", movieRoute);
router.use("/user", userRoute);
router.use("/tmdb", tmdbRoute);
router.use("/user_movie", userMovieRoute);

export default router;
