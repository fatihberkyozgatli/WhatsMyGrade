import dotenv from 'dotenv';

dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '5001', 10),
  database_url: process.env.DATABASE_URL,
  jwt_secret: process.env.JWT_SECRET,
  node_env: process.env.NODE_ENV || 'development',
};
