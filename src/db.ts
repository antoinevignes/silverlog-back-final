import postgres from "postgres";
import dotenv from "dotenv";

dotenv.config();

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not defined in environment variables");
}

const sql = postgres(process.env.DATABASE_URL, {
  ssl: "require",
});

export default sql;
