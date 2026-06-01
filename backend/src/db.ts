import { Pool } from 'pg';
import { config } from './config';

const pool = new Pool({
  connectionString: config.database_url,
});

export default pool;
