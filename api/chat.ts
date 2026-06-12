import * as dotenv from 'dotenv';
import type { VercelRequest, VercelResponse } from '@vercel/node';

dotenv.config({ path: '.env.local' });

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
): Promise<void> {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method Not Allowed' });
    return;
  }

  const rawApiKey = process.env.OPENAI_API_KEY;

  const apiKey = rawApiKey
    ?.trim()
    .replace(/^OPENAI_API_KEY=/, '')
    .replace(/^["']|["']$/g, '');

  if (!apiKey) {
    console.error('OPENAI_API_KEY is missing');
    res.status(500).json({ error: 'API Key not configured' });
    return;
  }

  console.log(
    'OPENAI_API_KEY loaded:',
    apiKey.slice(0, 7),
    'length:',
    apiKey.length
  );

  try {
    const { message, systemPrompt } = req.body;

    if (!message || !systemPrompt) {
      res.status(400).json({ error: 'Missing required fields' });
      return;
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: systemPrompt,
          },
          {
            role: 'user',
            content: message,
          },
        ],
        temperature: 0.7,
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI API error:', response.status, errorText);
      res.status(response.status).json({
        error: 'Failed to get response from OpenAI',
        detail: errorText,
      });
      return;
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      res.status(500).json({ error: 'No content in response' });
      return;
    }

    res.status(200).json({ content });
  } catch (error) {
    console.error('Error in /api/chat:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}