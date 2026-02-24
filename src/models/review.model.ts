import sql from "../db.js";
import type { Review, ReviewWithDetails } from "../types/db.js";

export async function createReviewModel(
  user_id: string,
  movie_id: number,
  content: string,
) {
  const rows = await sql<Review[]>`
    INSERT INTO reviews (
        user_id,
        movie_id,
        content
        )
    VALUES (
    ${user_id},
    ${movie_id},
    ${content}
    )
    ON CONFLICT (user_id, movie_id)
    DO UPDATE SET
    content = EXCLUDED.content
    RETURNING *;
    `;

  return rows[0] || null;
}

export async function getReviewModel(movie_id: string, user_id: string) {
  const rows = await sql<Review[]>`
    SELECT * FROM reviews
    WHERE movie_id = ${movie_id}
    AND user_id = ${user_id}
  `;

  return rows[0] || null;
}

export async function getReviewsModel(
  user_id: string | null,
  movie_id: string,
) {
  const rows = await sql<ReviewWithDetails[]>`
    SELECT 
      r.*,
      u.username,
      um.rating,
      COUNT(l.*)::int as like_count,
      EXISTS (
        SELECT 1 FROM review_likes
        WHERE review_id = r.id
        AND user_id = ${user_id}
      ) AS is_liked_by_user
    FROM reviews r
    LEFT JOIN users u ON u.id = r.user_id
    LEFT JOIN user_movies um ON um.user_id = r.user_id AND um.movie_id = r.movie_id
    LEFT JOIN review_likes l ON r.id = l.review_id
    WHERE r.movie_id = ${movie_id}
    GROUP BY 
      r.id, 
      u.username, 
      um.rating
    ORDER BY 
      COUNT(l.*) DESC,
      r.created_at DESC
    LIMIT 5;
  `;

  return rows;
}

export async function likeReviewModel(review_id: string, user_id: string) {
  return await sql`
    WITH deleted AS (
      DELETE FROM review_likes
      WHERE review_id = ${review_id}
      AND user_id = ${user_id}
      RETURNING *
    )
    INSERT INTO review_likes (review_id, user_id)
    SELECT ${review_id}, ${user_id}
    WHERE NOT EXISTS (SELECT 1 FROM deleted)
    AND EXISTS (SELECT 1 FROM reviews WHERE id = ${review_id});
  `;
}

export async function deleteReviewModel(review_id: string, user_id: string) {
  return await sql`
    DELETE FROM reviews
    WHERE id = ${review_id}
    AND user_id = ${user_id};
  `;
}
