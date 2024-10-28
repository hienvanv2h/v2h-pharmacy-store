import { Pool } from "pg";

const pool = new Pool({
  host: process.env.PG_HOST || "localhost",
  database: process.env.PG_DATABASE || "pharmacy_management2",
  user: process.env.PG_USER || "postgres",
  password: process.env.PG_PASSWORD || "test1234!",
  port: parseInt(process.env.PG_PORT, 10) || 5432,
});

export default pool;
