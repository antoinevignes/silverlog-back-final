import { Router } from "express";
import { getMovieData, getCrewPicks } from "../controllers/movie.controller.js";
import { getFriendsMovieActivity } from "../controllers/follow.controller.js";
import { requireAuth } from "../middlewares/auth.middleware.js";

const movieRoute = Router();

movieRoute.get("/crew-picks", getCrewPicks);
movieRoute.get("/:movie_id", getMovieData);
movieRoute.get("/:movie_id/friends", requireAuth, getFriendsMovieActivity);

export default movieRoute;
