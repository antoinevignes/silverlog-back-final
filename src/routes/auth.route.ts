import { Router } from "express";
import { optionalAuth } from "../middlewares/auth.middleware.js";
import {
  signIn,
  signOut,
  signUp,
  verifyEmail,
} from "../controllers/auth.controller.js";

const authRoute = Router();

authRoute.get("/session", optionalAuth, (req, res) => {
  if (!req.user) {
    return res.json({
      isAuthenticated: false,
      user: null,
    });
  }

  res.json({
    isAuthenticated: true,
    user: {
      id: req.user!.id,
      username: req.user!.username,
      email: req.user!.email,
      top_list_id: req.user!.top_list_id,
      watchlist_id: req.user!.watchlist_id,
      avatar_path: req.user!.avatar_path,
      backdrop_path: req.user!.backdrop_path,
    },
  });
});

authRoute.post("/sign-up", signUp);
authRoute.get("/verify-email", verifyEmail);
authRoute.post("/sign-in", signIn);
authRoute.post("/sign-out", signOut);

export default authRoute;
