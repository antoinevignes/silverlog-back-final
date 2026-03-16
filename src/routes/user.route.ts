import { Router } from "express";
import { requireAuth, optionalAuth } from "../middlewares/auth.middleware.js";
import { upload, uploadBanner } from "../utils/cloudinary.js";
import {
  updateAvatar,
  deleteAvatar,
  updateBanner,
  deleteBanner,
  updateLocation,
  updateUsername,
  deleteAccount,
  getUser,
  searchUsers,
} from "../controllers/user.controller.js";

const userRoute = Router();

userRoute.get("/search", optionalAuth, searchUsers);
userRoute.patch("/username", requireAuth, updateUsername);
userRoute.patch("/location", requireAuth, updateLocation);
userRoute.patch("/avatar", requireAuth, upload.single("avatar"), updateAvatar);
userRoute.delete("/avatar", requireAuth, deleteAvatar);
userRoute.patch("/banner", requireAuth, uploadBanner.single("banner"), updateBanner);
userRoute.delete("/banner", requireAuth, deleteBanner);
userRoute.delete("/delete", requireAuth, deleteAccount);
userRoute.get("/:user_id", optionalAuth, getUser);

export default userRoute;
