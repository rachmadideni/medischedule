import pg from "pg";
import dotenv from "dotenv";

dotenv.config();

const pool = new pg.Pool({
  host: process.env.ALLOYDB_HOST,
  port: parseInt(process.env.ALLOYDB_PORT || "5432"),
  user: process.env.ALLOYDB_USER,
  password: process.env.ALLOYDB_PASSWORD,
  database: process.env.ALLOYDB_DATABASE,
  max: 10,
  ssl: { rejectUnauthorized: false },
});

export async function query<T extends pg.QueryResultRow>(
  text: string,
  params?: unknown[]
): Promise<pg.QueryResult<T>> {
  return pool.query<T>(text, params);
}

export async function getClient() {
  return pool.connect();
}

export default pool;
