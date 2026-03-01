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
} from "../controllers/list.controller.js";

const listRoute = Router();

listRoute.get("/", optionalAuth, getLists);
listRoute.post("/", requireAuth, createList);
listRoute.get("/public", optionalAuth, getPublicLists);
listRoute.get("/:list_id", optionalAuth, getListDetails);
listRoute.get("/user/:user_id", optionalAuth, getUserCustomLists);
listRoute.post("/:list_id/toggle", requireAuth, toggleSaveList);
listRoute.delete("/:list_id", requireAuth, deleteList);
listRoute.post("/:list_id/movies/toggle", requireAuth, toggleMovieInList);

export default listRoute;
