import type { List as ListPayload } from "../controllers/list.controller.js";
import type { List, ListMovie } from "../types/db.js";
import sql from "../db.js";

// AJOUTER FILM A UNE LISTE
export async function toggleMovieInListModel(
  user_id: string,
  list_id: string,
  movie_id: number,
) {
  return await sql.begin(async (t) => {
    const tx = t as unknown as typeof sql;

    const list = await tx<List[]>`
      SELECT id, list_type
      FROM lists
      WHERE id = ${list_id}
        AND user_id = ${user_id}
    `;

    if (!list[0]) {
      throw new Error("Liste introuvable ou accès interdit");
    }

    const listType = list[0].list_type;

    const exists = await tx<{ "?column?": number }[]>`
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
      const result = await tx<{ total: number }[]>`
        SELECT COUNT(*)::int AS total
        FROM list_movies
        WHERE list_id = ${list_id}
      `;
      const currentCount = result[0]?.total || 0;

      if (currentCount >= 6) {
        return { action: "full" };
      }

      const maxResult = await tx<{ max: number }[]>`
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

    await tx`
      UPDATE lists 
      SET updated_at = NOW() 
      WHERE id = ${list_id}
    `;

    return { action: "added", position };
  });
}

// RECUPERER LES FILMS D'UNE LISTE
export async function getListDetailsModel(
  list_id: string,
  user_id: string | null,
) {
  const rows = await sql`
      SELECT 
        l.id, 
        l.user_id, 
        l.is_public, 
        l.updated_at,
        l.title,
        l.description,
        u.username,
      COUNT(sl.*)::int as saved_count,
        EXISTS (
          SELECT 1 
          FROM saved_lists sl 
          WHERE sl.list_id = l.id AND sl.user_id = ${user_id}
        ) AS is_saved,
        (
          SELECT COALESCE(jsonb_agg(jsonb_build_object(
            'id', m.movie_id, 
            'title', m.title,
            'poster_path', m.poster_path,
            'backdrop_path', m.backdrop_path,
            'release_date', m.release_date,
            'genres', m.genres,
            'seen_at', um.seen_at
          )), '[]') 
          FROM list_movies lm
          JOIN movies m ON m.movie_id = lm.movie_id
          LEFT JOIN user_movies um ON um.movie_id = lm.movie_id AND um.user_id = ${user_id}
          WHERE lm.list_id = l.id 
        ) AS movies
      FROM lists l
      LEFT JOIN users u ON u.id = l.user_id
      LEFT JOIN saved_lists sl ON sl.list_id = l.id
      WHERE l.id = ${list_id}
    GROUP BY l.id, u.username;
    `;

  return rows[0];
}

// FAIRE UNE LISTE
export async function createListModel(user_id: string, list: ListPayload) {
  const rows = await sql<List[]>`
        INSERT INTO lists (user_id, title, description, is_public, list_type)
        VALUES (${user_id}, ${list.title}, ${list.description}, ${list.is_public}, 'custom')
        RETURNING id, user_id, title, description, is_public, list_type
    `;

  return rows[0] || null;
}

// RECUPERER TOUTES LES LISTES DE L'UTILISATEUR
export async function getListsModel(user_id: string) {
  if (!user_id) {
    return [];
  }

  const rows = await sql<List[]>`
  SELECT * FROM lists
  WHERE user_id = ${user_id}
  `;

  return rows;
}

// SUPPRIMER UNE LISTE
export async function deleteListModel(list_id: number) {
  await sql`
        DELETE FROM lists
        WHERE id = ${list_id}
    `;
}

// RECUPERER LES LISTES PUBLIQUES
export async function getPublicListsModel() {
  return await sql<List[]>`
    SELECT 
      l.id,
      l.title,
      l.description,
      u.username,
      COUNT(sl.*)::int as saved_count,
        (SELECT COALESCE(jsonb_agg(jsonb_build_object(
          'movie_id', lm.movie_id, 
          'poster_path', m.poster_path)), 
        '[]')
          FROM list_movies lm
          LEFT JOIN movies m ON m.movie_id = lm.movie_id
          WHERE lm.list_id = l.id
        ) AS movies
    FROM lists l
    LEFT JOIN users u ON l.user_id = u.id
    LEFT JOIN saved_lists sl ON sl.list_id = l.id
    WHERE l.is_public = true
    GROUP BY l.id, u.username
  `;
}

export async function toggleSaveListModel(user_id: string, list_id: number) {
  return await sql.begin(async (t) => {
    const tx = t as unknown as typeof sql;

    const exists = await tx`
      SELECT 1 FROM saved_lists 
      WHERE user_id = ${user_id} AND list_id = ${list_id}
    `;

    if (exists.length > 0) {
      await tx`DELETE FROM saved_lists WHERE user_id = ${user_id} AND list_id = ${list_id}`;
      return { action: "un-saved" };
    } else {
      await tx`INSERT INTO saved_lists (user_id, list_id) VALUES (${user_id}, ${list_id})`;
      return { action: "saved" };
    }
  });
}

//////// HELPERS //////////

export async function findListById(list_id: number) {
  const rows = await sql<List[]>`
    SELECT * FROM lists
    WHERE id = ${list_id}
  `;
  return rows[0] || null;
}
