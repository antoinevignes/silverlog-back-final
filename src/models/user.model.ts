import sql from "../db.js";

// MODIFIER LE NOM D'UTILISATEUR
export async function updateUsernameModel(user_id: string, username: string) {
  await sql`
    UPDATE users SET username = ${username} WHERE id = ${user_id}
  `;
}

// MODIFIER LA LOCALISATION
export async function updateLocationModel(user_id: string, location: string) {
  await sql`
    UPDATE users SET location = ${location} WHERE id = ${user_id}
  `;
}

// MODIFIER LA DESCRIPTION
export async function updateDescriptionModel(user_id: string, description: string) {
  await sql`
    UPDATE users SET description = ${description} WHERE id = ${user_id}
  `;
}

// MODIFIER L'AVATAR
export async function updateAvatarPathModel(
  user_id: string,
  avatar_path: string | null,
) {
  await sql`
    UPDATE users SET avatar_path = ${avatar_path} WHERE id = ${user_id}
  `;
}

// MODIFIER LE BANNER
export async function updateBannerPathModel(
  user_id: string,
  banner_path: string | null,
) {
  await sql`
    UPDATE users SET banner_path = ${banner_path} WHERE id = ${user_id}
  `;
}

// SUPPRIMER LE COMPTE UTILISATEUR
export async function deleteUserModel(user_id: string) {
  return await sql.begin(async (t) => {
    const tx = t as unknown as typeof sql;
    await tx`DELETE FROM users WHERE id = ${user_id}`;
  });
}

// RECUPERER LES INFOS DE L'UTILISATEUR
export async function getUserModel(user_id: string, current_user_id?: string) {
  const rows = await sql`
WITH user_stats AS (
    SELECT 
        user_id,
        COUNT(movie_id) FILTER (WHERE seen_at IS NOT NULL OR rated_at IS NOT NULL) as viewed_movies,
        COUNT(movie_id) FILTER (
            WHERE (EXTRACT(YEAR FROM seen_at) = EXTRACT(YEAR FROM CURRENT_DATE)
            AND EXTRACT(MONTH FROM seen_at) = EXTRACT(MONTH FROM CURRENT_DATE))
            OR (EXTRACT(YEAR FROM rated_at) = EXTRACT(YEAR FROM CURRENT_DATE)
            AND EXTRACT(MONTH FROM rated_at) = EXTRACT(MONTH FROM CURRENT_DATE))
        ) as viewed_movies_this_month,
        COUNT(movie_id) FILTER (
            WHERE EXTRACT(YEAR FROM seen_at) = EXTRACT(YEAR FROM CURRENT_DATE)
            OR EXTRACT(YEAR FROM rated_at) = EXTRACT(YEAR FROM CURRENT_DATE)
        ) as viewed_movies_this_year,
        ROUND((AVG(rating) / 2)::NUMERIC, 1) as avg_rating
    FROM user_movies
    WHERE user_id = ${user_id}
    GROUP BY user_id
),

list_counts AS (
    SELECT 
        l.user_id,
        MAX(l.id) FILTER (WHERE l.list_type = 'watchlist') as watchlist_id,
        MAX(l.id) FILTER (WHERE l.list_type = 'top') as top_list_id,
        COUNT(lm.movie_id) FILTER (WHERE l.list_type = 'watchlist') as watchlist_total,
        COUNT(DISTINCT l.id) FILTER (WHERE l.list_type = 'custom') as custom_lists_total,
        COUNT(lm.movie_id) FILTER (
            WHERE l.list_type = 'watchlist' 
            AND lm.added_at >= NOW() - INTERVAL '30 days'
        ) as recent_watchlist_count
    FROM lists l
    LEFT JOIN list_movies lm ON lm.list_id = l.id
    WHERE l.user_id = ${user_id}
    GROUP BY l.user_id
),

top_movies_list AS (
    SELECT 
        l.user_id,
        jsonb_agg(jsonb_build_object(
            'id', m.movie_id, 
            'title', m.title,
            'poster_path', m.poster_path,
            'position', lm.position
        )
        ORDER BY lm.position ASC) as top_json
    FROM lists l
    JOIN list_movies lm ON lm.list_id = l.id
    JOIN movies m ON m.movie_id = lm.movie_id
    WHERE l.user_id = ${user_id} AND l.list_type = 'top'
    GROUP BY l.user_id
),

recent_activity AS (
    SELECT 
        jsonb_agg(jsonb_build_object(
            'id', m.movie_id,
            'title', m.title,
            'poster_path', m.poster_path,
            'rating', act.rating,
            'review_content', act.content,
            'rated_at', act.rated_at 
        ) ORDER BY act.rated_at DESC) as activity_json 
    FROM (
        SELECT 
            um.movie_id, 
            um.rating, 
            um.rated_at,
            r.content
        FROM user_movies um
        LEFT JOIN reviews r ON r.movie_id = um.movie_id AND r.user_id = um.user_id
        WHERE um.user_id = ${user_id} AND um.rating IS NOT NULL
        ORDER BY um.rated_at DESC
        LIMIT 16
    ) act
    JOIN movies m ON m.movie_id = act.movie_id
)

SELECT 
    u.id, 
    u.username, 
    u.role,
    u.description,
    u.location,
    u.avatar_path,
    u.banner_path,
    lc.watchlist_id,
    lc.top_list_id,
    COALESCE(us.viewed_movies, 0) as viewed_movies_count,
    COALESCE(us.viewed_movies_this_month, 0) as viewed_movies_this_month_count,
    COALESCE(us.viewed_movies_this_year, 0) as viewed_movies_this_year_count,
    COALESCE(us.avg_rating, 0) as avg_rating,
    COALESCE(lc.watchlist_total, 0) as watchlist_total,
    COALESCE(lc.custom_lists_total, 0) as custom_lists_total,
    COALESCE(lc.recent_watchlist_count, 0) as recent_watchlist_count,
    COALESCE(tm.top_json, '[]') as top_movies,
    COALESCE((SELECT activity_json FROM recent_activity), '[]') as recent_activity,
    (SELECT COUNT(*) FROM follows WHERE following_id = u.id) as followers_count,
    (SELECT COUNT(*) FROM follows WHERE follower_id = u.id) as following_count,
    EXISTS(SELECT 1 FROM follows WHERE follower_id = ${current_user_id || null} AND following_id = u.id) as is_following
FROM users u
LEFT JOIN user_stats us ON us.user_id = u.id
LEFT JOIN list_counts lc ON lc.user_id = u.id
LEFT JOIN top_movies_list tm ON tm.user_id = u.id
WHERE u.id = ${user_id};
  `;

  return rows[0];
}

// MODIFIER LE MOT DE PASSE
export async function updatePasswordModel(user_id: string, password_hash: string) {
  await sql`
    UPDATE users SET password = ${password_hash} WHERE id = ${user_id}
  `;
}

// RECHERCHER DES UTILISATEURS PAR USERNAME
export async function searchUsersModel(query: string) {
  const rows = await sql`
    SELECT id, username, avatar_path
    FROM users
    WHERE username ILIKE ${"%" + query + "%"}
    LIMIT 10
  `;
  return rows;
}

// UTILISATEURS LES PLUS ACTIFS
export async function getActiveUsersModel(limit: number = 6) {
  const rows = await sql`
    SELECT 
      u.id,
      u.username,
      u.avatar_path,
      COALESCE(r.reviews_count, 0) as reviews_count,
      COALESCE(m.viewed_count, 0) as watched_count
    FROM users u
    LEFT JOIN (
      SELECT user_id, COUNT(*) as reviews_count
      FROM reviews
      GROUP BY user_id
    ) r ON r.user_id = u.id
    LEFT JOIN (
      SELECT user_id, COUNT(*) as viewed_count
      FROM user_movies
      GROUP BY user_id
    ) m ON m.user_id = u.id
    WHERE (r.reviews_count > 0 OR m.viewed_count > 0)
    ORDER BY (COALESCE(r.reviews_count, 0) + COALESCE(m.viewed_count, 0)) DESC
    LIMIT ${limit}
  `;
  return rows;
}
