import { Router } from "express";
import { requireAuth } from "../middlewares/auth.middleware.js";
import {
  getListMovies,
  toggleMovieInList,
} from "../controllers/list.controller.js";

const listRoute = Router();

listRoute.get("/:list_id", requireAuth, getListMovies);
listRoute.post("/:list_id/movies/toggle", requireAuth, toggleMovieInList);

export default listRoute;
