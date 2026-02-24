import type { List } from "../controllers/list.controller.js";
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

      if (listType === "top") {
        await tx`
          WITH updated AS (
            SELECT id, row_number() OVER (ORDER BY position) as new_pos
            FROM list_movies
            WHERE list_id = ${list_id}
          )
          UPDATE list_movies
          SET position = updated.new_pos
          FROM updated
          WHERE list_movies.id = updated.id
        `;
      }

      return { action: "removed" };
    }

    let position: number | null = null;

    if (listType === "top") {
      const result = await tx`
        SELECT COUNT(*)::int AS total
        FROM list_movies
        WHERE list_id = ${list_id}
      `;
      const currentCount = result[0]?.total || 0;

      if (currentCount >= 6) {
        return { action: "full" };
      }

      const maxResult = await tx`
        SELECT COALESCE(MAX(position), 0) AS max
        FROM list_movies
        WHERE list_id = ${list_id}
      `;

      position = Number(maxResult[0]?.max) + 1;
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

// FAIRE UNE LISTE
export async function createListModel(user_id: string, list: List) {
  const rows = await sql`
        INSERT INTO lists (user_id, title, description, is_public, list_type)
        VALUES (${user_id}, ${list.title}, ${list.description}, ${list.is_public}, 'custom')
        RETURNING id, user_id, title, description, is_public, list_type
    `;

  return rows[0];
}

// RECUPERER TOUTES LES LISTES DE L'UTILISATEUR
export async function getListsModel(user_id: string) {
  if (!user_id) {
    return [];
  }

  const rows = await sql`
  SELECT * FROM lists
  WHERE user_id = ${user_id}
  `;

  return rows.length > 0 ? rows : [];
}

// SUPPRIMER UNE LISTE
export async function deleteListModel(list_id: number) {
  await sql`
        DELETE FROM lists
        WHERE id = ${list_id}
    `;
}

//////// HELPERS //////////

export async function findListById(list_id: number) {
  const rows = await sql`
    SELECT * FROM lists
    WHERE id = ${list_id}
  `;
  return rows[0];
}
