import { Router } from "express";
import { getMovieData } from "../controllers/movie.controller.js";

const movieRoute = Router();

movieRoute.get("/:movie_id", getMovieData);

export default movieRoute;
