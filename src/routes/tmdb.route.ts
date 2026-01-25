import { Router } from "express";
import { proxyTMDB } from "../controllers/tmdb.controller.js";

const tmdbRoute = Router();

tmdbRoute.get("/*splat", proxyTMDB);

export default tmdbRoute;
