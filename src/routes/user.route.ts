import { Router } from "express";
import {
  signIn,
  signOut,
  signUp,
  verifyEmail,
} from "../controllers/user.controller.js";
import { optionalAuth } from "../middlewares/auth.middleware.js";

const userRoute = Router();

userRoute.get("/session", optionalAuth, (req, res) => {
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
    },
  });
});
userRoute.post("/sign-up", signUp);
userRoute.get("/verify-email", verifyEmail);
userRoute.post("/sign-in", signIn);
userRoute.post("/sign-out", signOut);

export default userRoute;
