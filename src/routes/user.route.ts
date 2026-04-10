import { Router } from "express";
import { requireAuth, optionalAuth } from "../middlewares/auth.middleware.js";
import { upload, uploadBanner } from "../utils/cloudinary.js";
import {
  updateAvatar,
  deleteAvatar,
  updateBanner,
  deleteBanner,
  updateLocation,
  updateDescription,
  updateUsername,
  deleteAccount,
  getUser,
  searchUsers,
  updatePassword,
  getActiveUsers,
} from "../controllers/user.controller.js";

const userRoute = Router();

userRoute.get("/search", optionalAuth, searchUsers);
userRoute.get("/active", getActiveUsers);
userRoute.patch("/username", requireAuth, updateUsername);
userRoute.patch("/location", requireAuth, updateLocation);
userRoute.patch("/description", requireAuth, updateDescription);
userRoute.patch("/avatar", requireAuth, upload.single("avatar"), updateAvatar);
userRoute.delete("/avatar", requireAuth, deleteAvatar);
userRoute.patch("/banner", requireAuth, uploadBanner.single("banner"), updateBanner);
userRoute.delete("/banner", requireAuth, deleteBanner);
userRoute.delete("/delete", requireAuth, deleteAccount);
userRoute.patch("/password", requireAuth, updatePassword);
userRoute.get("/:user_id", optionalAuth, getUser);

export default userRoute;
