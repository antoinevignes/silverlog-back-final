import sql from "../db.js";

export async function createReviewModel(
  user_id: string,
  movie_id: number,
  content: string,
) {
  const rows = await sql`
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

  return rows[0];
}

export async function getReviewModel(movie_id: string, user_id: string) {
  const rows = await sql`
    SELECT * FROM reviews
    WHERE movie_id = ${movie_id}
    AND user_id = ${user_id}
  `;

  return rows[0];
}

export async function getReviewsModel(user_id: string, movie_id: string) {
  const rows = await sql`
    SELECT 
      r.*,
      u.username,
      um.rating,
      COUNT(l.*) as like_count,
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
  return await sql.begin(async (tx) => {
    const review = await tx`
      SELECT * FROM reviews
      WHERE id = ${review_id}`;

    if (!review[0]) {
      throw new Error("Review introuvable ou accès interdit");
    }

    const exists = await tx`
      SELECT 1
      FROM review_likes
      WHERE review_id = ${review_id}
      AND user_id = ${user_id}`;

    if (exists.length > 0) {
      await tx`
        DELETE FROM review_likes
        WHERE review_id = ${review_id}
        AND user_id = ${user_id}
      `;
    } else {
      await tx`
        INSERT INTO review_likes (review_id, user_id)
        VALUES (${review_id}, ${user_id})
      `;
    }
  });
}
