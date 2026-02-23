import { Router } from "express";
import { requireAuth } from "../middlewares/auth.middleware.js";
import { toggleMovieInList } from "../controllers/list.controller.js";

const listRoute = Router();

listRoute.post("/:list_id/movies/toggle", requireAuth, toggleMovieInList);

export default listRoute;
