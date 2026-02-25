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
