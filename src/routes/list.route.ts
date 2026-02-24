import { Router } from "express";
import { optionalAuth, requireAuth } from "../middlewares/auth.middleware.js";
import {
  createList,
  deleteList,
  getListMovies,
  getLists,
  toggleMovieInList,
} from "../controllers/list.controller.js";

const listRoute = Router();

listRoute.get("/", optionalAuth, getLists);
listRoute.get("/:list_id", requireAuth, getListMovies);
listRoute.post("/", requireAuth, createList);
listRoute.delete("/:list_id", requireAuth, deleteList);
listRoute.post("/:list_id/movies/toggle", requireAuth, toggleMovieInList);

export default listRoute;
