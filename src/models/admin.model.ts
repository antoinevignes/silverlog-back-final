import sql from "../db.js";

// RECUPERER LES STATISTIQUES DE L'ADMIN
export async function getAdminStatsModel() {
  const [users] = await sql`SELECT COUNT(*)::int as count FROM users`;
  const [reviews] = await sql`SELECT COUNT(*)::int as count FROM reviews`;
  const [movies] = await sql`SELECT COUNT(*)::int as count FROM user_movies`;
  const [lists] =
    await sql`SELECT COUNT(*)::int as count FROM lists WHERE list_type = 'custom'`;

  return {
    totalUsers: users?.count || 0,
    totalReviews: reviews?.count || 0,
    totalWatchedMovies: movies?.count || 0,
    totalCustomLists: lists?.count || 0,
  };
}

// RECUPERER LES UTILISATEURS
export async function getAdminUsersModel() {
  return await sql`
    SELECT id, username, email, role, created_at, (verification_token IS NULL) as verified
    FROM users
    ORDER BY created_at DESC
  `;
}

// METTRE A JOUR LE ROLE D'UN UTILISATEUR
export async function updateUserRoleModel(
  userId: string,
  role: "user" | "admin",
) {
  await sql`
    UPDATE users SET role = ${role} WHERE id = ${userId}
  `;
}

// SUPPRIMER UN UTILISATEUR
export async function deleteUserModel(userId: string) {
  await sql`DELETE FROM users WHERE id = ${userId}`;
}

// RECUPERER LES AVIS
export async function getAdminReviewsModel() {
  return await sql`
    SELECT 
      r.id, 
      r.movie_id, 
      r.content, 
      r.created_at,
      u.username,
      u.avatar_path,
      m.title as movie_title,
      m.poster_path as movie_poster_path,
      um.rating
    FROM reviews r
    JOIN users u ON u.id = r.user_id
    JOIN movies m ON m.movie_id = r.movie_id
    LEFT JOIN user_movies um ON um.user_id = r.user_id AND um.movie_id = r.movie_id
    ORDER BY r.created_at DESC
    LIMIT 50
  `;
}

// SUPPRIMER UN AVIS
export async function deleteAdminReviewModel(reviewId: number) {
  await sql`DELETE FROM reviews WHERE id = ${reviewId}`;
}
