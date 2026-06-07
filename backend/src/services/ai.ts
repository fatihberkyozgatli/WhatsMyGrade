import OpenAI from 'openai';
import { config } from '../config';

export const DEFAULT_MODEL = 'gpt-4o';

export const isAiConfigured = (): boolean => Boolean(config.openai_api_key);

let client: OpenAI | null = null;

export const getAi = (): OpenAI => {
  if (!config.openai_api_key) {
    throw new Error('OPENAI_API_KEY is not configured');
  }
  if (!client) {
    client = new OpenAI({ apiKey: config.openai_api_key });
  }
  return client;
};
