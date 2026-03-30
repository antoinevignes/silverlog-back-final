import type { Request, Response } from "express";
import z from "zod";
import {
  getNotificationsModel,
  getUnreadCountModel,
  markAsReadModel,
  markAllAsReadModel,
} from "../models/notification.model.js";

const notificationIdSchema = z.object({
  id: z.coerce.number(),
});

export async function getNotifications(req: Request, res: Response) {
  const user_id = req.user!.id;
  const notifications = await getNotificationsModel(user_id);
  return res.status(200).json(notifications);
}

export async function getUnreadCount(req: Request, res: Response) {
  const user_id = req.user!.id;
  const count = await getUnreadCountModel(user_id);
  return res.status(200).json({ count });
}

export async function markAsRead(req: Request, res: Response) {
  const user_id = req.user!.id;
  const { id } = notificationIdSchema.parse(req.params);
  await markAsReadModel(id, user_id);
  return res.status(200).json({ success: true });
}

export async function markAllAsRead(req: Request, res: Response) {
  const user_id = req.user!.id;
  await markAllAsReadModel(user_id);
  return res.status(200).json({ success: true });
}
