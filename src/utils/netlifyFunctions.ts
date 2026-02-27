import { auth } from '@/integrations/firebase/client';

/**
 * Helper to call Netlify serverless functions.
 * It automatically retrieves the Firebase Auth ID Token for the current user
 * and attaches it as a Bearer token to the Authorization header.
 * 
 * In development, it calls the local Netlify dev server (port 8888).
 * In production, it calls the relative /.netlify/functions/ path.
 */
export const callNetlifyFunction = async (functionName: string, data: any = {}) => {
  try {
    const user = auth.currentUser;
    if (!user) {
      throw new Error("User must be logged in to call this function.");
    }

    // Force refresh token to ensure it's valid
    const token = await user.getIdToken(true);
    
    // Determine the base URL based on the environment
    const isDev = import.meta.env.DEV;
    const baseUrl = isDev 
      ? 'http://localhost:8888/.netlify/functions' 
      : '/.netlify/functions';

    const url = `${baseUrl}/${functionName}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error((errorData && errorData.message) || `Failed with status: ${response.status}`);
    }

    const json = await response.json();
    return { data: json.data };

  } catch (error) {
    console.error(`Error calling netlify function ${functionName}:`, error);
    throw error;
  }
};
