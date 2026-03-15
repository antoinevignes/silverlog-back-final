import sql from "../db.js";

export async function upsertMovieModel(
  movie_id: number,
  title: string,
  release_date: string | null,
  poster_path: string | null,
  backdrop_path: string | null,
  genres: { id: number; name: string }[] | null,
) {
  await sql`
    INSERT INTO movies (movie_id, title, release_date, poster_path, backdrop_path, genres)
    VALUES (
      ${movie_id},
      ${title},
      ${release_date},
      ${poster_path},
      ${backdrop_path},
 ${genres ? sql.json(genres) : null}
    )
    ON CONFLICT (movie_id) DO UPDATE SET
      title = COALESCE(EXCLUDED.title, movies.title),
      release_date = COALESCE(EXCLUDED.release_date, movies.release_date),
      poster_path = COALESCE(EXCLUDED.poster_path, movies.poster_path),
      backdrop_path = COALESCE(EXCLUDED.backdrop_path, movies.backdrop_path),
      genres = COALESCE(EXCLUDED.genres, movies.genres)
  `;
}

export async function getMovieDataModel(movie_id: string) {
  const rows = await sql<{ movie_avg: string; rating_count: string }[]>`
    SELECT 
        (AVG(rating) / 2)::NUMERIC(10,1) as movie_avg,
        COUNT(rating) as rating_count
    FROM user_movies 
    WHERE movie_id = ${movie_id};`;

  return rows[0] || null;
}

export async function getCrewPicksModel() {
  const rows = await sql`
    SELECT 
      cp.movie_id as id,
      m.title,
      m.poster_path,
      cp.added_at
    FROM crew_picks cp
    JOIN movies m ON cp.movie_id = m.movie_id
    JOIN users u ON u.id = cp.added_by
    ORDER BY cp.added_at DESC
  `;

  return rows;
}

// RECUPERER L'ACTIVITE DES AMIS POUR UN FILM SPECIFIQUE
export async function getFriendsMovieActivityModel(
  user_id: string,
  movie_id: string,
) {
  return await sql`
    SELECT 
        um.movie_id, 
        um.rating, 
        um.rated_at as created_at,
        r.content as review_content,
        u.id as user_id,
        u.username,
        u.avatar_path,
        u.banner_path,
        'rating' as type
    FROM user_movies um
    JOIN users u ON u.id = um.user_id
    LEFT JOIN reviews r ON r.movie_id = um.movie_id AND r.user_id = um.user_id
    WHERE um.movie_id = ${movie_id}
    AND um.user_id IN (
        SELECT following_id FROM follows WHERE follower_id = ${user_id}
    )
    AND um.rating IS NOT NULL
    ORDER BY created_at DESC;
  `;
}
