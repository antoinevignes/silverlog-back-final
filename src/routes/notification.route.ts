import { Router } from "express";
import { requireAuth } from "../middlewares/auth.middleware.js";
import {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
} from "../controllers/notification.controller.js";

const notificationRoute = Router();

notificationRoute.get("/", requireAuth, getNotifications);
notificationRoute.get("/unread-count", requireAuth, getUnreadCount);
notificationRoute.patch("/:id/read", requireAuth, markAsRead);
notificationRoute.patch("/read-all", requireAuth, markAllAsRead);

export default notificationRoute;
