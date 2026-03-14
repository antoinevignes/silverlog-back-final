import { Router } from "express";
import { requireAuth } from "../middlewares/auth.middleware.js";
import {
  followUser,
  unfollowUser,
  getFollowers,
  getFollowing,
} from "../controllers/follow.controller.js";

const followRoute = Router();

followRoute.post("/:id/follow", requireAuth, followUser);
followRoute.delete("/:id/follow", requireAuth, unfollowUser);
followRoute.get("/:id/followers", getFollowers);
followRoute.get("/:id/following", getFollowing);

export default followRoute;
