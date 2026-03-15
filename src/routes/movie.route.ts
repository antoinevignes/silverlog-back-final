import { Router } from "express";
import {
  getMovieData,
  getCrewPicks,
  getFriendsMovieActivity,
} from "../controllers/movie.controller.js";

const movieRoute = Router();

movieRoute.get("/crew-picks", getCrewPicks);
movieRoute.get("/:movie_id", getMovieData);
movieRoute.get("/:movie_id/friends", getFriendsMovieActivity);

export default movieRoute;
