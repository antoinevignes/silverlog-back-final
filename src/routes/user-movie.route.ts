import { Router } from "express";
import {
  deleteRating,
  getSeenMovies,
  getState,
  updateSeenDate,
  upsertRating,
} from "../controllers/user-movie.controller.js";
import { optionalAuth, requireAuth } from "../middlewares/auth.middleware.js";

const userMovieRoute = Router();

userMovieRoute.get("/seen", requireAuth, getSeenMovies);
userMovieRoute.get("/:movie_id", optionalAuth, getState);
userMovieRoute.post("/:movie_id/rate", requireAuth, upsertRating);
userMovieRoute.delete("/:movie_id", requireAuth, deleteRating);
userMovieRoute.post("/:movie_id/seen-date", requireAuth, updateSeenDate);

export default userMovieRoute;
