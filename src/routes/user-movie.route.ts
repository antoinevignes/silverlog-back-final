import { Router } from "express";
import {
  deleteRating,
  getState,
  upsertRating,
} from "../controllers/user-movie.controller.js";
import { optionalAuth, requireAuth } from "../middlewares/auth.middleware.js";

const userMovieRoute = Router();

userMovieRoute.get("/:movie_id", optionalAuth, getState);
userMovieRoute.post("/:movie_id/rate", requireAuth, upsertRating);
userMovieRoute.delete("/:movie_id", requireAuth, deleteRating);

export default userMovieRoute;
