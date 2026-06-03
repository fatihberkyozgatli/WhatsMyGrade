import dotenv from 'dotenv';

dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '5001', 10),
  database_url: process.env.DATABASE_URL,
  jwt_secret: process.env.JWT_SECRET,
  cors_origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  trust_proxy: process.env.TRUST_PROXY ? Number(process.env.TRUST_PROXY) : false,
};
