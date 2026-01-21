import sql from "../db.js";

// CREER UTILISATEUR
export async function signUpModel({
  username,
  email,
  hashedPassword,
  role,
}: {
  username: string;
  email: string;
  hashedPassword: string;
  role: "user" | "admin";
}) {
  return (sql as any).begin(async (tx: any) => {
    const [user] = await tx`
      INSERT INTO users (username, email, password, role)
      VALUES (${username}, ${email}, ${hashedPassword}, ${role})
      RETURNING id, username, email, role`;

    await tx`
        INSERT INTO lists (user_id, list_type, title)
        VALUES
          (${user.id}, 'watchlist', 'Watchlist'),
          (${user.id}, 'top', 'Top 50')
        RETURNING id, list_type`;

    return user;
  });
}

// VERIFIER SI UTILISATEUR EXISTE
export async function checkUserExists(email: string, username = "") {
  try {
    const rows = await sql`
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
