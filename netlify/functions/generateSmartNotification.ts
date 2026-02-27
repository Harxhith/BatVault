import { GoogleGenAI } from '@google/genai';
import { verifyFirebaseToken } from './utils/firebase';

const getAIClient = () =>
  new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY || '',
  });

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'OPTIONS, POST',
};

export const handler = async (event: any) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: CORS_HEADERS };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers: CORS_HEADERS, body: 'Method Not Allowed' };
  }

  try {
    // ── 1. Verify Auth Token ──────────────────────────────────────────────────
    const authHeader = event.headers?.authorization || event.headers?.Authorization || '';
    if (!authHeader.startsWith('Bearer ')) {
      return {
        statusCode: 401,
        headers: CORS_HEADERS,
        body: JSON.stringify({ error: 'unauthenticated' }),
      };
    }

    const idToken = authHeader.slice(7);
    try {
      await verifyFirebaseToken(idToken);
    } catch (e) {
      return {
        statusCode: 403,
        headers: CORS_HEADERS,
        body: JSON.stringify({ error: 'unauthorized' }),
      };
    }

    // ── 2. Build Gemini prompt ────────────────────────────────────────────────
    const data = JSON.parse(event.body || '{}');
    const { todayTotal, averageDaily, categories, goals, timeOfDay } = data;

    const prompt = `You are an AI financial assistant in the Bat-Vault app.
    Generate a short, friendly, and highly engaging 1-sentence notification emphasizing the user's financial status.
    Keep it strictly under 120 characters to fit on a mobile lock screen. Do not use hashtags. Be witty.
    
    Context:
    Time of day: ${timeOfDay}
    Spent today: ₹${todayTotal} (Average daily: ₹${averageDaily})
    Top categories today: ${categories ? JSON.stringify(categories) : 'None'}
    Goals progress: ${goals || 'No goals set'}`;

    const aiInstance = getAIClient();
    const response = await aiInstance.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    const message = response.text || 'Your financial summary is ready!';

    return {
      statusCode: 200,
      headers: CORS_HEADERS,
      body: JSON.stringify({
        data: {
          success: true,
          message: message.trim().replace(/^[\"']|[\"']$/g, ''),
        },
      }),
    };
  } catch (error: any) {
    console.error('Smart Notification Error:', error);
    return {
      statusCode: 500,
      headers: CORS_HEADERS,
      body: JSON.stringify({ error: 'internal', message: error.message }),
    };
  }
};
