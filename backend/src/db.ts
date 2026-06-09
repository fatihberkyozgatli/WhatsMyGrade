import { Pool } from 'pg';
import { config } from './config';

const pool = new Pool({
  connectionString: config.database_url,
  ssl: config.database_ssl ? { rejectUnauthorized: false } : undefined,
});

export default pool;
