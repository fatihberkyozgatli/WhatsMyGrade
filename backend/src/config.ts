import dotenv from 'dotenv';

dotenv.config();

// Fail fast at boot if required env vars are missing, instead of letting the
// server start and surface failures as per-request 500s later.
const REQUIRED_ENV_VARS = ['DATABASE_URL', 'JWT_SECRET'] as const;
const missingEnvVars = REQUIRED_ENV_VARS.filter((key) => !process.env[key]);
if (missingEnvVars.length > 0) {
  console.error(
    `Missing required environment variable(s): ${missingEnvVars.join(', ')}. ` +
      'Set them (e.g. in backend/.env) before starting the server.'
  );
  process.exit(1);
}

export const config = {
  port: parseInt(process.env.PORT || '5001', 10),
  database_url: process.env.DATABASE_URL as string,
  jwt_secret: process.env.JWT_SECRET as string,
  cors_origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  trust_proxy: process.env.TRUST_PROXY ? Number(process.env.TRUST_PROXY) : false,
};
