import { Router } from "express";
import {
  getMovieData,
  getCrewPicks,
  updateCrewPicks,
  getFriendsMovieActivity,
  getTopRatedMovies,
} from "../controllers/movie.controller.js";
import { optionalAuth, requireAuth, requireAdmin } from "../middlewares/auth.middleware.js";

const movieRoute = Router();

movieRoute.get("/crew-picks", getCrewPicks);
movieRoute.put("/crew-picks", requireAuth, requireAdmin, updateCrewPicks);
movieRoute.get("/top-rated", getTopRatedMovies);
movieRoute.get("/:movie_id", getMovieData);
movieRoute.get("/:movie_id/friends", optionalAuth, getFriendsMovieActivity);

export default movieRoute;
