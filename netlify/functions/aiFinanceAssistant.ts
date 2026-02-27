import { GoogleGenAI } from '@google/genai';
import { verifyFirebaseToken, firestoreQuery } from './utils/firebase';

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
  // Handle CORS preflight
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
        body: JSON.stringify({ error: 'unauthenticated', message: 'Missing or invalid Authorization header' }),
      };
    }

    const idToken = authHeader.slice(7);
    let tokenUser: { uid: string };
    try {
      tokenUser = await verifyFirebaseToken(idToken);
    } catch (e: any) {
      return {
        statusCode: 403,
        headers: CORS_HEADERS,
        body: JSON.stringify({ error: 'unauthorized', message: 'Invalid authentication token' }),
      };
    }

    // ── 2. Parse request body ─────────────────────────────────────────────────
    const data = JSON.parse(event.body || '{}');
    const { message, userId, previousMessages } = data;

    if (!message || !userId) {
      return {
        statusCode: 400,
        headers: CORS_HEADERS,
        body: JSON.stringify({ error: 'invalid-argument', message: 'Message and userId are required.' }),
      };
    }

    // Ensure users can only query their own data
    if (tokenUser.uid !== userId) {
      return {
        statusCode: 403,
        headers: CORS_HEADERS,
        body: JSON.stringify({ error: 'permission-denied', message: 'You do not have permission to access this data.' }),
      };
    }

    // ── 3. Fetch user context from Firestore (using the user's own token) ─────
    const [expenses, goals, settingsDocs] = await Promise.all([
      firestoreQuery(
        idToken,
        'expenses',
        [{ field: 'user_id', op: 'EQUAL', value: userId }],
        { field: 'date', direction: 'DESCENDING' },
        50
      ),
      firestoreQuery(idToken, 'goals', [{ field: 'user_id', op: 'EQUAL', value: userId }]),
      firestoreQuery(idToken, 'user_settings', [{ field: 'user_id', op: 'EQUAL', value: userId }], undefined, 1),
    ]);

    const balance = settingsDocs[0]?.data?.initial_balance || 0;

    const expensesContext = expenses
      .map(e => `${e.data.date}: ${e.data.type === 'income' ? '+' : '-'}₹${e.data.amount} for ${e.data.description}`)
      .join('\n');

    const goalsContext = goals
      .map(g => `${g.data.name}: Target ₹${g.data.target_amount}, Deadline: ${g.data.deadline || 'None'}`)
      .join('\n');

    // ── 4. Build prompt and call Gemini ───────────────────────────────────────
    const systemPrompt = `You are Alfred, a helpful, witty, and concise financial assistant.
    You manage the user's finances in an app called BatVault.
    
    Here is the user's recent financial context:
    Current Initial Base Balance: ₹${balance}
    
    Recent Transactions:
    ${expensesContext || 'No recent transactions found.'}
    
    Financial Goals:
    ${goalsContext || 'No active goals found.'}
    
    Answer the user's question clearly and concisely based on this context.
    If they ask about something not in this context, remind them you only see their recent data.`;

    let history = '';
    if (previousMessages && Array.isArray(previousMessages)) {
      history = previousMessages.map((msg: any) => `${msg.role}: ${msg.content}`).join('\n');
    }

    const fullPrompt = `${systemPrompt}\n\nChat History:\n${history}\n\nuser: ${message}`;

    const aiInstance = getAIClient();
    const response = await aiInstance.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: fullPrompt,
    });

    // ── 5. Return response ────────────────────────────────────────────────────
    return {
      statusCode: 200,
      headers: CORS_HEADERS,
      body: JSON.stringify({
        data: {
          success: true,
          reply: response.text || "I'm sorry, I couldn't process that request at the moment.",
        },
      }),
    };
  } catch (error: any) {
    console.error('AI Error:', error);
    return {
      statusCode: 500,
      headers: CORS_HEADERS,
      body: JSON.stringify({ error: 'internal', message: error.message || 'Failed to process request' }),
    };
  }
};
