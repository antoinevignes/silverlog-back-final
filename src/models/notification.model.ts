import sql from "../db.js";

export interface Notification {
  id: number;
  recipient_id: number;
  sender_id: number;
  type: "review" | "recommendation";
  movie_id: number;
  review_id: number | null;
  message: string | null;
  is_read: boolean;
  created_at: Date;
}

export interface NotificationWithDetails extends Notification {
  sender_username: string;
  sender_avatar: string | null;
  movie_title: string;
  movie_poster: string | null;
}

export async function createNotificationModel(
  recipient_id: string | number,
  sender_id: string | number,
  type: "review" | "recommendation",
  movie_id: number,
  review_id?: string | number | null,
  message?: string | null,
) {
  const rows = await sql<Notification[]>`
    INSERT INTO notifications (
      recipient_id, sender_id, type, movie_id, review_id, message
    ) VALUES (
      ${recipient_id}, ${sender_id}, ${type}, ${movie_id}, ${review_id ?? null}, ${message ?? null}
    )
    RETURNING *
  `;
  return rows[0] || null;
}

export async function getNotificationsModel(user_id: string, limit = 30) {
  const rows = await sql<NotificationWithDetails[]>`
    SELECT
      n.*,
      u.username AS sender_username,
      u.avatar_path AS sender_avatar,
      m.title AS movie_title,
      m.poster_path AS movie_poster
    FROM notifications n
    JOIN users u ON u.id = n.sender_id
    JOIN movies m ON m.movie_id = n.movie_id
    WHERE n.recipient_id = ${user_id}
    ORDER BY n.created_at DESC
    LIMIT ${limit}
  `;
  return rows;
}

export async function getUnreadCountModel(user_id: string) {
  const rows = await sql<{ count: number }[]>`
    SELECT COUNT(*)::int AS count
    FROM notifications
    WHERE recipient_id = ${user_id}
    AND is_read = FALSE
  `;
  return rows[0]?.count ?? 0;
}

export async function markAsReadModel(notification_id: number, user_id: string) {
  await sql`
    UPDATE notifications
    SET is_read = TRUE
    WHERE id = ${notification_id}
    AND recipient_id = ${user_id}
  `;
}

export async function markAllAsReadModel(user_id: string) {
  await sql`
    UPDATE notifications
    SET is_read = TRUE
    WHERE recipient_id = ${user_id}
    AND is_read = FALSE
  `;
}
