import sql from "../db.js";

export async function getMovieDataModel(movie_id: string) {
  const rows = await sql`
    SELECT 
        (AVG(rating) / 2)::NUMERIC(10,1) as movie_avg,
        COUNT(rating) as rating_count
    FROM user_movies 
    WHERE movie_id = ${movie_id};`;

  return rows[0];
}
