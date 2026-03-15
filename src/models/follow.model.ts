import sql from "../db.js";

// SUIVRE UN UTILISATEUR
export async function followUserModel(
  follower_id: string,
  following_id: string,
) {
  await sql`
    INSERT INTO follows (follower_id, following_id) 
    VALUES (${follower_id}, ${following_id})
    ON CONFLICT DO NOTHING
  `;
}

// NE PLUS SUIVRE
export async function unfollowUserModel(
  follower_id: string,
  following_id: string,
) {
  await sql`
    DELETE FROM follows 
    WHERE follower_id = ${follower_id} AND following_id = ${following_id}
  `;
}

// RECUPERER LES FOLLOWERS
export async function getFollowersModel(user_id: string) {
  return await sql`
    SELECT u.id, u.username, u.avatar_path
    FROM follows f
    JOIN users u ON u.id = f.follower_id
    WHERE f.following_id = ${user_id}
    ORDER BY f.created_at DESC
  `;
}

// RECUPERER LES ABONNEMENTS (FOLLOWING)
export async function getFollowingModel(user_id: string) {
  return await sql`
    SELECT u.id, u.username, u.avatar_path
    FROM follows f
    JOIN users u ON u.id = f.following_id
    WHERE f.follower_id = ${user_id}
    ORDER BY f.created_at DESC
  `;
}

// RECUPERER L'ACTIVITE DES ABONNEMENTS (FEED)
export async function getFollowingActivityModel(user_id: string) {
  return await sql`
    WITH activity_feed AS (
      SELECT 
          um.movie_id, 
          um.rating, 
          um.rated_at as created_at,
          r.content as review_content,
          u.id as user_id,
          u.username,
          u.avatar_path,
          u.banner_path,
          m.title,
          m.poster_path,
          'rating' as type
      FROM user_movies um
      JOIN users u ON u.id = um.user_id
      JOIN movies m ON m.movie_id = um.movie_id
      LEFT JOIN reviews r ON r.movie_id = um.movie_id AND r.user_id = um.user_id
      WHERE um.user_id IN (
          SELECT following_id FROM follows WHERE follower_id = ${user_id}
      )
      AND um.rating IS NOT NULL
      
      UNION ALL
      
      SELECT 
          lm.movie_id, 
          NULL::integer as rating, 
          lm.added_at as created_at,
          NULL::text as review_content,
          u.id as user_id,
          u.username,
          u.avatar_path,
          u.banner_path,
          m.title,
          m.poster_path,
          'watchlist' as type
      FROM list_movies lm
      JOIN lists l ON l.id = lm.list_id
      JOIN users u ON u.id = l.user_id
      JOIN movies m ON m.movie_id = lm.movie_id
      WHERE l.user_id IN (
          SELECT following_id FROM follows WHERE follower_id = ${user_id}
      )
      AND l.list_type = 'watchlist'
    )
    SELECT * 
    FROM activity_feed 
    ORDER BY created_at DESC
    LIMIT 20;
  `;
}
