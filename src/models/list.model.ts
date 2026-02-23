import sql from "../db.js";

// AJOUTER FILM A UNE LISTE
export async function toggleMovieInListModel(
  user_id: string,
  list_id: string,
  movie_id: number,
) {
  return await sql.begin(async (t) => {
    const tx = t as unknown as typeof sql;

    const list = await tx`
      SELECT id, list_type
      FROM lists
      WHERE id = ${list_id}
        AND user_id = ${user_id}
    `;

    if (!list[0]) {
      throw new Error("Liste introuvable ou accès interdit");
    }

    const listType = list[0].list_type;

    const exists = await tx`
      SELECT 1
      FROM list_movies
      WHERE list_id = ${list_id}
        AND movie_id = ${movie_id}
    `;

    if (exists.length > 0) {
      await tx`
        DELETE FROM list_movies
        WHERE list_id = ${list_id}
          AND movie_id = ${movie_id}
      `;

      return { action: "removed" };
    }

    let position: number | null = null;

    if (listType === "top") {
      const result = await tx`
        SELECT COALESCE(MAX(position), 0) AS max
        FROM list_movies
        WHERE list_id = ${list_id}
      `;

      const currentMax = result[0]?.max || 0;

      position = Number(currentMax) + 1;

      if (position > 50) {
        return { action: "full" };
      }
    }

    await tx`
      INSERT INTO list_movies (list_id, movie_id, position)
      VALUES (${list_id}, ${movie_id}, ${position})
    `;

    return { action: "added", position };
  });
}

// RECUPERER LES FILMS DE LA WATCHLIST
export async function getListMoviesModel(list_id: string) {
  return await sql`
    SELECT movie_id, added_at, position FROM list_movies
    WHERE list_id = ${list_id}
    ORDER BY added_at DESC
    `;
}
