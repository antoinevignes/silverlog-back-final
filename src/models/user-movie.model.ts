import sql from "../db.js";
import type { UserMovie } from "../types/db.js";

export interface MovieState {
  seen: boolean;
  rating: number | null;
  lists: { id: number; list_type: string; title: string }[];
}

// RECUPERER L'ETAT UTILISATEUR D'UN FILM
export async function getStateModel(user_id: string, movie_id: string) {
  const rows = await sql<MovieState[]>`
    WITH base AS (
      SELECT ${user_id}::int AS user_id, ${movie_id}::int AS movie_id
    )
    SELECT
      COALESCE(um.seen, false) AS seen,
      um.rating,
      COALESCE(
          jsonb_agg(
            jsonb_build_object(
              'id', l.id,
              'list_type', l.list_type,
              'title', l.title
            )
          ) FILTER (WHERE l.id IS NOT NULL),
          '[]'::jsonb
        ) AS lists
    FROM base b
    LEFT JOIN user_movies um
      ON um.user_id = b.user_id
     AND um.movie_id = b.movie_id
    LEFT JOIN list_movies lm
      ON lm.movie_id = b.movie_id
    LEFT JOIN lists l
      ON l.id = lm.list_id
     AND l.user_id = b.user_id
    GROUP BY um.seen, um.rating;
    `;

  return rows[0] || null;
}

// AJOUTER OU MODIFIER LA NOTE D'UN FILM
export async function upsertRatingModel(
  user_id: string,
  movie_id: string,
  rating: number,
) {
  const rows = await sql<UserMovie[]>`
    INSERT INTO user_movies (
      user_id,
      movie_id,
      seen,
      rating,
      rated_at
    )
    VALUES (
      ${user_id},
      ${movie_id},
      'true',
      ${rating},
      NOW()
    )
    ON CONFLICT (user_id, movie_id)
    DO UPDATE SET
      rating = EXCLUDED.rating,
      rated_at = NOW()
    RETURNING *;
  `;

  return rows[0] || null;
}

// SUPPRIMER LA NOTE D'UN FILM
export async function deleteRatingModel(user_id: string, movie_id: string) {
  await sql`
    UPDATE user_movies
    SET rating = NULL
    WHERE user_id = ${user_id}
    AND movie_id = ${movie_id};
  `;
}

// MODIFIER LA DATE DE VISIONNAGE D'UN FILM
export async function updateSeenDateModel(
  date: Date,
  user_id: string,
  movie_id: string,
) {
  await sql`
    INSERT INTO user_movies (
      user_id,
      movie_id,
      seen,
      seen_at
    )
    VALUES (
      ${user_id},
      ${movie_id},
      'true',
      ${date}
    )
    ON CONFLICT (user_id, movie_id)
    DO UPDATE SET
      seen_at = EXCLUDED.seen_at;
  `;
}

// RECUPERER LES FILMS VUS PAR L'UTILISATEUR
export async function getSeenMoviesModel(user_id: string) {
  const rows = await sql<
    { movie_id: number; rating: number | null; seen_at: Date }[]
  >`
      SELECT 
      um.movie_id as id, 
      m.title,
      m.release_date,
      m.poster_path,
      um.rating, 
      um.seen_at
    FROM user_movies um 
    LEFT JOIN movies m ON m.movie_id = um.movie_id
    WHERE um.user_id = ${user_id}
    AND um.seen_at IS NOT NULL
  `;

  return rows;
}
