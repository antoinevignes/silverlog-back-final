import { Router } from "express";
import { getMovieData, getCrewPicks } from "../controllers/movie.controller.js";

const movieRoute = Router();

movieRoute.get("/crew-picks", getCrewPicks);
movieRoute.get("/:movie_id", getMovieData);

export default movieRoute;
