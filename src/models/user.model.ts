import sql from "../db.js";
import type { User, RefreshToken, List } from "../types/db.js";

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

interface SignInUser extends User {
  watchlist_id: number | null;
  top_list_id: number | null;
}

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

export async function getRefreshTokenModel(refreshToken: string) {
  const [token] = await sql<RefreshToken[]>`
    SELECT *
    FROM refresh_tokens
    WHERE token = ${refreshToken}
  `;

  return token || null;
}

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

export async function deleteRefreshTokenModel(refreshToken: string) {
  await sql`
    DELETE FROM refresh_tokens
    WHERE token = ${refreshToken}
  `;
}
