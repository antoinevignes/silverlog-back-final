import type { Request, Response } from "express";
import z from "zod";
import sql from "../db.js";
import { createNotificationModel } from "../models/notification.model.js";
import { getIO } from "../socket.js";
import { AppError } from "../utils/handle-errors.js";

const recommendSchema = z.object({
  recipient_id: z.coerce.number(),
  movie_id: z.coerce.number(),
});

// ENVOYER UNE RECOMMENDATION
export async function sendRecommendation(req: Request, res: Response) {
  const sender_id = req.user!.id;
  const { recipient_id, movie_id } = recommendSchema.parse(req.body);

  if (recipient_id === Number(sender_id)) {
    throw new AppError(
      400,
      "Vous ne pouvez pas vous recommander un film à vous-même",
    );
  }

  const followers = await sql`
    SELECT follower_id FROM follows
    WHERE following_id = ${sender_id}
    AND follower_id = ${recipient_id}
  `;

  if (followers.length === 0) {
    throw new AppError(403, "Vous ne pouvez recommander qu'à vos followers");
  }

  const movie = await sql`
    SELECT movie_id, title, poster_path FROM movies
    WHERE movie_id = ${movie_id}
  `;

  const notification = await createNotificationModel(
    recipient_id,
    sender_id,
    "recommendation",
    movie_id,
  );

  const sender = await sql`
    SELECT username, avatar_path FROM users WHERE id = ${sender_id}
  `;

  const io = getIO();
  io.to(`user:${recipient_id}`).emit("notification", {
    id: notification?.id,
    type: "recommendation",
    sender_id: Number(sender_id),
    sender_username: sender[0]?.username,
    sender_avatar: sender[0]?.avatar_path,
    movie_id,
    movie_title: movie[0]?.title,
    movie_poster: movie[0]?.poster_path,
    created_at: notification?.created_at,
  });

  return res.status(201).json({ success: true });
}
