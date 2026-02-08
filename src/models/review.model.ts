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
