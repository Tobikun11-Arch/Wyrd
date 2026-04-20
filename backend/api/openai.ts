import OpenAI from 'openai';

let _openai: OpenAI | null = null;

export function getOpenAI() {
  if (_openai) return _openai;

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error('OPENAI_API_KEY is required');

  _openai = new OpenAI({apiKey});
  return _openai;
}
