import { Router } from "express";
import { optionalAuth, requireAuth } from "../middlewares/auth.middleware.js";
import {
  createList,
  deleteList,
  getListDetails,
  getLists,
  getPublicLists,
  toggleMovieInList,
  toggleSaveList,
} from "../controllers/list.controller.js";

const listRoute = Router();

listRoute.get("/", optionalAuth, getLists);
listRoute.get("/public", optionalAuth, getPublicLists);
listRoute.get("/:list_id", optionalAuth, getListDetails);
listRoute.post("/:list_id/toggle", requireAuth, toggleSaveList);
listRoute.post("/", requireAuth, createList);
listRoute.delete("/:list_id", requireAuth, deleteList);
listRoute.post("/:list_id/movies/toggle", requireAuth, toggleMovieInList);

export default listRoute;
