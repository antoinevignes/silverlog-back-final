import { Router } from "express";
import { optionalAuth, requireAuth } from "../middlewares/auth.middleware.js";
import {
  createList,
  deleteList,
  getListDetails,
  getLists,
  getPublicLists,
  getUserCustomLists,
  toggleMovieInList,
  toggleSaveList,
  updateList,
  removeMovieFromList,
} from "../controllers/list.controller.js";

const listRoute = Router();

listRoute.get("/", optionalAuth, getLists);
listRoute.post("/", requireAuth, createList);
listRoute.get("/public", optionalAuth, getPublicLists);
listRoute.get("/:list_id", optionalAuth, getListDetails);
listRoute.get("/user/:user_id", optionalAuth, getUserCustomLists);
listRoute.post("/:list_id/toggle", requireAuth, toggleSaveList);
listRoute.patch("/:list_id", requireAuth, updateList);
listRoute.delete("/:list_id", requireAuth, deleteList);
listRoute.delete("/:list_id/movies/:movie_id", requireAuth, removeMovieFromList);
listRoute.post("/:list_id/movies/toggle", requireAuth, toggleMovieInList);

export default listRoute;
