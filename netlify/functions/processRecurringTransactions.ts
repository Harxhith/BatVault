import { format, addDays } from 'date-fns';
import { verifyFirebaseToken, firestoreQuery, firestoreCreate, firestoreUpdate } from './utils/firebase';

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
    let tokenUser: { uid: string };
    try {
      tokenUser = await verifyFirebaseToken(idToken);
    } catch (e) {
      return {
        statusCode: 403,
        headers: CORS_HEADERS,
        body: JSON.stringify({ error: 'unauthorized' }),
      };
    }

    const userId = tokenUser.uid;
    const today = new Date();
    const todayStr = today.toISOString();
    const todayDate = format(today, 'yyyy-MM-dd');

    // ── 2. Query due recurring transactions ───────────────────────────────────
    // Note: Firestore REST API doesn't support multiple inequality filters on different fields.
    // We query by user_id + active=true, then filter next_run_date client-side.
    const docs = await firestoreQuery(
      idToken,
      'recurring_transactions',
      [
        { field: 'user_id', op: 'EQUAL', value: userId },
        { field: 'active', op: 'EQUAL', value: true },
      ]
    );

    // Filter for transactions due today or earlier
    const dueDocs = docs.filter(doc => {
      const nextRunDate = doc.data.next_run_date;
      return nextRunDate && nextRunDate <= todayStr;
    });

    if (dueDocs.length === 0) {
      return {
        statusCode: 200,
        headers: CORS_HEADERS,
        body: JSON.stringify({ data: { processed: 0, results: [] } }),
      };
    }

    // ── 3. Process each due transaction ───────────────────────────────────────
    const results: { id: string; status: string }[] = [];

    for (const doc of dueDocs) {
      const transaction = doc.data;

      // Create a new expense entry
      await firestoreCreate(idToken, 'expenses', {
        user_id: userId,
        amount: transaction.amount,
        description: transaction.description || 'Recurring Transaction',
        category_id: transaction.category_id,
        date: todayDate,
        type: transaction.type,
      });

      // Calculate next run date
      let nextDate = new Date(transaction.next_run_date || today);
      switch (transaction.frequency) {
        case 'weekly':
          nextDate = addDays(nextDate, 7);
          break;
        case 'monthly':
          nextDate.setMonth(nextDate.getMonth() + 1);
          break;
        case 'quarterly':
          nextDate.setMonth(nextDate.getMonth() + 3);
          break;
        case 'yearly':
          nextDate.setFullYear(nextDate.getFullYear() + 1);
          break;
      }

      // Deactivate if past end_date
      const isActive = !(transaction.end_date && new Date(transaction.end_date) < nextDate);

      // Update the recurring transaction document
      await firestoreUpdate(idToken, doc.name, {
        last_run_date: todayStr,
        next_run_date: nextDate.toISOString(),
        active: isActive,
      });

      results.push({ id: doc.id, status: 'success' });
    }

    return {
      statusCode: 200,
      headers: CORS_HEADERS,
      body: JSON.stringify({
        data: {
          success: true,
          processed: results.length,
          results,
        },
      }),
    };
  } catch (error: any) {
    console.error('Recurring Processing Error:', error);
    return {
      statusCode: 500,
      headers: CORS_HEADERS,
      body: JSON.stringify({ error: 'internal', message: error.message }),
    };
  }
};
