import sql from "../db.js";
import type { UserMovie } from "../types/db.js";

export interface MovieState {
  seen: boolean;
  seen_at: Date | null;
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
      um.seen_at,
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
    GROUP BY um.seen, um.rating, um.seen_at;
    `;

  return rows[0] || null;
}

// AJOUTER OU MODIFIER LA NOTE D'UN FILM AVEC METADONNEES
export async function upsertRatingWithMovieModel(
  user_id: string,
  movie_id: number,
  rating: number,
  movieData: {
    title: string;
    release_date: string | null;
    poster_path: string | null;
    backdrop_path: string | null;
    genres: { id: number; name: string }[] | null;
  },
) {
  return await sql.begin(async (t) => {
    const tx = t as unknown as typeof sql;

    await tx`
      INSERT INTO movies (movie_id, title, release_date, poster_path, backdrop_path, genres)
      VALUES (
        ${movie_id},
        ${movieData.title},
        ${movieData.release_date},
        ${movieData.poster_path},
        ${movieData.backdrop_path},
        ${movieData.genres ? tx.json(movieData.genres) : null}
      )
      ON CONFLICT (movie_id) DO UPDATE SET
        title = COALESCE(EXCLUDED.title, movies.title),
        release_date = COALESCE(EXCLUDED.release_date, movies.release_date),
        poster_path = COALESCE(EXCLUDED.poster_path, movies.poster_path),
        backdrop_path = COALESCE(EXCLUDED.backdrop_path, movies.backdrop_path),
        genres = COALESCE(EXCLUDED.genres, movies.genres)
    `;

    const [userMovie] = await tx<UserMovie[]>`
      INSERT INTO user_movies (user_id, movie_id, seen, rating, rated_at)
      VALUES (${user_id}, ${movie_id}, true, ${rating}, NOW())
      ON CONFLICT (user_id, movie_id)
      DO UPDATE SET
        rating = EXCLUDED.rating,
        rated_at = NOW(),
        seen = true
      RETURNING *;
    `;

    return userMovie;
  });
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

// MODIFIER LA DATE DE VISIONNAGE D'UN FILM AVEC METADONNEES
export async function updateSeenDateWithMovieModel(
  user_id: string,
  movie_id: number,
  date: Date | null,
  movieData?: {
    title: string;
    release_date: string | null;
    poster_path: string | null;
    backdrop_path: string | null;
    genres: { id: number; name: string }[] | null;
  },
) {
  return await sql.begin(async (t) => {
    const tx = t as unknown as typeof sql;

    if (movieData) {
      await tx`
        INSERT INTO movies (movie_id, title, release_date, poster_path, backdrop_path, genres)
        VALUES (
          ${movie_id},
          ${movieData.title},
          ${movieData.release_date},
          ${movieData.poster_path},
          ${movieData.backdrop_path},
          ${movieData.genres ? tx.json(movieData.genres) : null}
        )
        ON CONFLICT (movie_id) DO UPDATE SET
          title = COALESCE(EXCLUDED.title, movies.title),
          release_date = COALESCE(EXCLUDED.release_date, movies.release_date),
          poster_path = COALESCE(EXCLUDED.poster_path, movies.poster_path),
          backdrop_path = COALESCE(EXCLUDED.backdrop_path, movies.backdrop_path),
          genres = COALESCE(EXCLUDED.genres, movies.genres)
      `;
    }

    await tx`
      INSERT INTO user_movies (user_id, movie_id, seen, seen_at)
      VALUES (${user_id}, ${movie_id}, true, ${date ?? null})
      ON CONFLICT (user_id, movie_id)
      DO UPDATE SET
        seen_at = EXCLUDED.seen_at,
        seen = true;
    `;
  });
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

// SUPPRIMER UN FILM DU JOURNAL (VISIONNAGE)
export async function removeFromDiarylModel(user_id: string, movie_id: number) {
  return await sql.begin(async (t) => {
    const tx = t as unknown as typeof sql;

    // 1. Mettre à jour l'état vu
    await tx`
      UPDATE user_movies
      SET seen = false, seen_at = NULL
      WHERE user_id = ${user_id} AND movie_id = ${movie_id}
    `;

    // 2. Nettoyage : si ni note ni vu, on supprime la ligne
    await tx`
      DELETE FROM user_movies
      WHERE user_id = ${user_id} 
        AND movie_id = ${movie_id} 
        AND seen = false 
        AND rating IS NULL
    `;

    return { success: true };
  });
}
