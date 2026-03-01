import sql from "../db.js";
import type { User, RefreshToken, List } from "../types/db.js";

interface SignInUser extends User {
  watchlist_id: number | null;
  top_list_id: number | null;
}

// CREER UTILISATEUR
export async function signUpModel({
  username,
  email,
  hashedPassword,
  role,
  verificationToken,
  tokenExpiresAt,
}: {
  username: string;
  email: string;
  hashedPassword: string;
  role: "user" | "admin";
  verificationToken: string;
  tokenExpiresAt: Date;
}) {
  return sql.begin(async (t) => {
    const tx = t as unknown as typeof sql;

    const [user] = await tx<User[]>`
      INSERT INTO users (username, email, password, role, verification_token, token_expires_at)
      VALUES (
        ${username}, 
        ${email}, 
        ${hashedPassword}, 
        ${role}, 
        ${verificationToken}, 
        ${tokenExpiresAt})
      RETURNING id, username, email, role`;

    await tx<List[]>`
        INSERT INTO lists (user_id, list_type, title)
        VALUES
          (${user!.id}, 'watchlist', 'Watchlist'),
          (${user!.id}, 'top', 'Top 50')
        RETURNING id, list_type`;

    return user!;
  });
}

// VERIFIER SI UTILISATEUR EXISTE AVEC TOKEN
export async function checkUserVerification(token: string) {
  const [user] = await sql<User[]>`
    SELECT id, verified, token_expires_at
    FROM users
    WHERE verification_token = ${token}
  `;

  return user;
}

// VERIFIER SI EMAIL VALIDÉ
export async function verifyEmailModel(user_id: string) {
  await sql`
    UPDATE users
    SET 
      verified = TRUE,
      verification_token = NULL,
      token_expires_at = NULL
    WHERE id = ${user_id}
  `;
}

// VERIFIER SI UTILISATEUR EXISTE
export async function checkUserExists(email: string, username = "") {
  try {
    const rows = await sql<
      { email_exists: boolean; username_exists: boolean }[]
    >`
      SELECT 
        email = ${email} as email_exists,
        username = ${username} as username_exists
      FROM users
      WHERE email = ${email} OR username = ${username}
      LIMIT 1
    `;

    if (rows.length === 0) {
      return { emailExists: false, usernameExists: false };
    }

    return {
      emailExists: rows[0]?.email_exists,
      usernameExists: rows[0]?.username_exists,
    };
  } catch (error) {
    console.error("Erreur lors de la vérification:", error);
    throw error;
  }
}

// CONNEXION UTILISATEUR
export async function signInModel(email: string) {
  const rows = await sql<SignInUser[]>`
    SELECT
      u.id,
      u.email,
      u.username,
      u.password,
      u.verified,

      MAX(CASE WHEN l.list_type = 'watchlist' THEN l.id END) AS watchlist_id,
      MAX(CASE WHEN l.list_type = 'top' THEN l.id END) AS top_list_id

    FROM users u
    LEFT JOIN lists l ON l.user_id = u.id
    WHERE u.email = ${email}
    GROUP BY u.id;
  `;

  return rows[0] || null;
}

// RECUPERER LES TOKENS DE L'UTILISATEUR
export async function getUserRefreshTokensModel(user_id: string) {
  await sql`DELETE FROM refresh_tokens WHERE expires_at < NOW()`;

  const tokens = await sql<RefreshToken[]>`
    SELECT *
    FROM refresh_tokens
    WHERE user_id = ${user_id}
  `;

  return tokens;
}

// STOCKER LE REFRESH TOKEN
export async function storeRefreshTokenModel(
  user_id: string,
  refreshToken: string,
  expires_at: Date,
) {
  await sql`
    INSERT INTO refresh_tokens (user_id, token, expires_at)
    VALUES (${user_id}, ${refreshToken}, ${expires_at})
  `;
}

// SUPPRIMER LE REFRESH TOKEN
export async function deleteRefreshTokenByIdModel(id: number) {
  await sql`
    DELETE FROM refresh_tokens
    WHERE id = ${id}
  `;
}

// RECUPERER LES INFOS DE L'UTILISATEUR
export async function getUserModel(user_id: string) {
  const rows = await sql`
WITH user_stats AS (
    SELECT 
        user_id,
        COUNT(movie_id) as viewed_movies,
        COUNT(movie_id) FILTER (
            WHERE EXTRACT(YEAR FROM seen_at) = EXTRACT(YEAR FROM CURRENT_DATE)
        ) as viewed_movies_this_year,
        ROUND((AVG(rating) / 2)::NUMERIC, 1) as avg_rating
    FROM user_movies
    WHERE user_id = ${user_id}
    GROUP BY user_id
),

list_counts AS (
    SELECT 
        l.user_id,
        COUNT(lm.movie_id) FILTER (WHERE l.list_type = 'watchlist') as watchlist_total,
        COUNT(DISTINCT l.id) FILTER (WHERE l.list_type = 'custom') as custom_lists_total
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
            'poster_path', m.poster_path
        )) as top_json
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
            'review_content', act.content
        )) as activity_json
    FROM (
        SELECT um.movie_id, um.rating, r.content
        FROM user_movies um
        LEFT JOIN reviews r ON r.movie_id = um.movie_id AND r.user_id = um.user_id
        WHERE um.user_id = ${user_id} AND um.rating IS NOT NULL
        ORDER BY um.rated_at DESC
        LIMIT 8
    ) act
    JOIN movies m ON m.movie_id = act.movie_id
)

SELECT 
    u.id, 
    u.username, 
    u.role,
    u.description,
    u.location,
    COALESCE(us.viewed_movies, 0) as viewed_movies_count,
    COALESCE(us.viewed_movies_this_year, 0) as viewed_movies_this_year_count,
    COALESCE(us.avg_rating, 0) as avg_rating,
    COALESCE(lc.watchlist_total, 0) as watchlist_total,
    COALESCE(lc.custom_lists_total, 0) as custom_lists_total,
    COALESCE(tm.top_json, '[]') as top_movies,
    COALESCE((SELECT activity_json FROM recent_activity), '[]') as recent_activity
FROM users u
LEFT JOIN user_stats us ON us.user_id = u.id
LEFT JOIN list_counts lc ON lc.user_id = u.id
LEFT JOIN top_movies_list tm ON tm.user_id = u.id
WHERE u.id = ${user_id};
  `;

  return rows[0];
}
