import OpenAI from 'openai';

const provider = process.env.AI_PROVIDER ?? 'tetrate';

const baseURL =
  provider === 'deepinfra'
    ? process.env.DEEPINFRA_BASE_URL
    : process.env.TETRATE_BASE_URL ?? 'https://api.router.tetrate.ai/v1';

const apiKey =
  provider === 'deepinfra'
    ? process.env.DEEPINFRA_API_KEY!
    : process.env.TETRATE_API_KEY!;

export const ai = new OpenAI({ baseURL, apiKey });
