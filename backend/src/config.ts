import dotenv from 'dotenv';

dotenv.config();

const REQUIRED_ENV_VARS = ['DATABASE_URL', 'JWT_SECRET'] as const;
const missingEnvVars = REQUIRED_ENV_VARS.filter((key) => !process.env[key]);
if (missingEnvVars.length > 0) {
  console.error(
    `Missing required environment variable(s): ${missingEnvVars.join(', ')}. ` +
      'Set them (e.g. in backend/.env) before starting the server.'
  );
  process.exit(1);
}

const parseTrustProxy = (value: string | undefined): boolean | number | string => {
  if (!value) return false;
  if (value === 'true') return true;
  if (value === 'false') return false;
  const hops = Number(value);
  return Number.isNaN(hops) ? value : hops;
};

export const config = {
  port: parseInt(process.env.PORT || '5001', 10),
  database_url: process.env.DATABASE_URL as string,
  jwt_secret: process.env.JWT_SECRET as string,
  cors_origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  trust_proxy: parseTrustProxy(process.env.TRUST_PROXY),
  openai_api_key: process.env.OPENAI_API_KEY || '',
};
