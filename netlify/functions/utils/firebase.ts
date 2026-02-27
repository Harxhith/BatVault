/**
 * Firebase REST API utilities for Netlify Functions.
 * Uses only fetch + env vars — NO firebase-admin / service account needed.
 *
 * Required env vars:
 *   FIREBASE_PROJECT_ID  (e.g. "batvault")
 *   FIREBASE_API_KEY     (or VITE_FIREBASE_API_KEY) — the web API key
 */

const PROJECT_ID =
  process.env.FIREBASE_PROJECT_ID ||
  process.env.VITE_FIREBASE_PROJECT_ID ||
  '';

const API_KEY =
  process.env.FIREBASE_API_KEY ||
  process.env.VITE_FIREBASE_API_KEY ||
  '';

const FIRESTORE_BASE = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents`;

// ─── Token verification ──────────────────────────────────────────────────────

/**
 * Verifies a Firebase ID token using the Identity Toolkit REST API.
 * Returns the decoded token payload (uid, email, etc.) on success.
 * Throws on invalid/expired token.
 */
export async function verifyFirebaseToken(idToken: string): Promise<{ uid: string; email?: string }> {
  const url = `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${API_KEY}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ idToken }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as any)?.error?.message || 'Invalid token');
  }

  const data = await res.json() as { users?: { localId: string; email?: string }[] };
  const user = data.users?.[0];
  if (!user) throw new Error('Token did not resolve to a user');

  return { uid: user.localId, email: user.email };
}

// ─── Firestore helpers ───────────────────────────────────────────────────────

/** Convert a Firestore REST value object to a plain JS value */
function fromFirestoreValue(val: any): any {
  if (val.stringValue !== undefined) return val.stringValue;
  if (val.integerValue !== undefined) return Number(val.integerValue);
  if (val.doubleValue !== undefined) return val.doubleValue;
  if (val.booleanValue !== undefined) return val.booleanValue;
  if (val.timestampValue !== undefined) return val.timestampValue;
  if (val.nullValue !== undefined) return null;
  if (val.arrayValue !== undefined)
    return (val.arrayValue.values || []).map(fromFirestoreValue);
  if (val.mapValue !== undefined)
    return fromFirestoreFields(val.mapValue.fields || {});
  return null;
}

/** Convert Firestore REST fields map to plain JS object */
function fromFirestoreFields(fields: Record<string, any>): Record<string, any> {
  const obj: Record<string, any> = {};
  for (const [key, val] of Object.entries(fields)) {
    obj[key] = fromFirestoreValue(val);
  }
  return obj;
}

/** Convert a plain JS value to a Firestore REST value object */
function toFirestoreValue(val: any): any {
  if (val === null || val === undefined) return { nullValue: null };
  if (typeof val === 'boolean') return { booleanValue: val };
  if (typeof val === 'number') {
    return Number.isInteger(val) ? { integerValue: String(val) } : { doubleValue: val };
  }
  if (typeof val === 'string') return { stringValue: val };
  if (Array.isArray(val)) return { arrayValue: { values: val.map(toFirestoreValue) } };
  if (typeof val === 'object') return { mapValue: { fields: toFirestoreFields(val) } };
  return { stringValue: String(val) };
}

/** Convert plain JS object to Firestore REST fields map */
function toFirestoreFields(obj: Record<string, any>): Record<string, any> {
  const fields: Record<string, any> = {};
  for (const [key, val] of Object.entries(obj)) {
    fields[key] = toFirestoreValue(val);
  }
  return fields;
}

/** Firestore document as returned by queries */
export interface FSDocument {
  name: string;
  id: string;
  data: Record<string, any>;
}

/**
 * Run a Firestore structured query against a collection.
 * Uses the user's own idToken for auth — no service account needed.
 * Firestore security rules must allow the user to read/write their own data.
 */
export async function firestoreQuery(
  idToken: string,
  collectionId: string,
  filters: Array<{ field: string; op: string; value: any }>,
  orderBy?: { field: string; direction?: 'ASCENDING' | 'DESCENDING' },
  limit?: number
): Promise<FSDocument[]> {
  const url = `${FIRESTORE_BASE}:runQuery`;

  const whereFilters = filters.map(f => ({
    fieldFilter: {
      field: { fieldPath: f.field },
      op: f.op,
      value: toFirestoreValue(f.value),
    },
  }));

  const structuredQuery: any = {
    from: [{ collectionId }],
    where:
      whereFilters.length === 1
        ? whereFilters[0]
        : { compositeFilter: { op: 'AND', filters: whereFilters } },
  };
  if (orderBy) {
    structuredQuery.orderBy = [{ field: { fieldPath: orderBy.field }, direction: orderBy.direction || 'ASCENDING' }];
  }
  if (limit) structuredQuery.limit = limit;

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${idToken}`,
    },
    body: JSON.stringify({ structuredQuery }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(`Firestore query failed: ${JSON.stringify(err)}`);
  }

  const rows = await res.json() as any[];
  return rows
    .filter(r => r.document)
    .map(r => ({
      name: r.document.name,
      id: r.document.name.split('/').pop(),
      data: fromFirestoreFields(r.document.fields || {}),
    }));
}

/**
 * Create a Firestore document in a collection (auto-ID).
 */
export async function firestoreCreate(
  idToken: string,
  collectionId: string,
  data: Record<string, any>
): Promise<string> {
  const url = `${FIRESTORE_BASE}/${collectionId}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${idToken}`,
    },
    body: JSON.stringify({ fields: toFirestoreFields(data) }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(`Firestore create failed: ${JSON.stringify(err)}`);
  }
  const doc = await res.json() as any;
  return doc.name.split('/').pop();
}

/**
 * Update (patch) specific fields of a Firestore document by its full name path.
 */
export async function firestoreUpdate(
  idToken: string,
  docName: string,
  data: Record<string, any>
): Promise<void> {
  const fieldMask = Object.keys(data).map(k => `updateMask.fieldPaths=${encodeURIComponent(k)}`).join('&');
  const url = `https://firestore.googleapis.com/v1/${docName}?${fieldMask}`;
  const res = await fetch(url, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${idToken}`,
    },
    body: JSON.stringify({ fields: toFirestoreFields(data) }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(`Firestore update failed: ${JSON.stringify(err)}`);
  }
}
