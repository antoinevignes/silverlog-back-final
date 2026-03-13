import { Router } from "express";
import {
  getUser,
  signIn,
  signOut,
  signUp,
  updateAvatar,
  deleteAvatar,
  updateBanner,
  deleteBanner,
  updateLocation,
  updateUsername,
  verifyEmail,
  deleteAccount,
} from "../controllers/user.controller.js";
import { optionalAuth, requireAuth } from "../middlewares/auth.middleware.js";
import { upload, uploadBanner } from "../utils/cloudinary.js";

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
      avatar_path: req.user!.avatar_path,
      banner_path: req.user!.banner_path,
    },
  });
});
userRoute.post("/sign-up", signUp);
userRoute.get("/verify-email", verifyEmail);
userRoute.post("/sign-in", signIn);
userRoute.post("/sign-out", signOut);

userRoute.patch("/username", requireAuth, updateUsername);
userRoute.patch("/location", requireAuth, updateLocation);
userRoute.patch("/avatar", requireAuth, upload.single("avatar"), updateAvatar);
userRoute.delete("/avatar", requireAuth, deleteAvatar);

userRoute.patch(
  "/banner",
  requireAuth,
  uploadBanner.single("banner"),
  updateBanner,
);
userRoute.delete("/banner", requireAuth, deleteBanner);

userRoute.delete("/delete", requireAuth, deleteAccount);

userRoute.get("/:user_id", getUser);

export default userRoute;
