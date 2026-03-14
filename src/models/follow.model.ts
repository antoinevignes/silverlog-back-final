import sql from "../db.js";

// SUIVRE UN UTILISATEUR
export async function followUserModel(follower_id: string, following_id: string) {
  await sql`
    INSERT INTO follows (follower_id, following_id) 
    VALUES (${follower_id}, ${following_id})
    ON CONFLICT DO NOTHING
  `;
}

// NE PLUS SUIVRE
export async function unfollowUserModel(follower_id: string, following_id: string) {
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
