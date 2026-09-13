const SUPABASE_URL = 'https://ofodxwpukrgegtavahfm.supabase.co';
const SUPABASE_KEY = 'sb_publishable_RvJAQ8p31BacTxANx3gltw_KRxlpoxe';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const authHeader = req.headers.authorization || '';
    if (!authHeader.startsWith('Bearer ')) {
      res.status(401).json({ error: 'Please log in to use the AI assistant.' });
      return;
    }

    const userResponse = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
      headers: { apikey: SUPABASE_KEY, Authorization: authHeader }
    });
    const user = await userResponse.json();
    if (!userResponse.ok || !user?.id || !user?.email_confirmed_at) {
      res.status(401).json({ error: 'Your account must be verified before using the AI assistant.' });
      return;
    }

    const entitlementResponse = await fetch(
      `${SUPABASE_URL}/rest/v1/user_entitlements?select=status,expires_at&user_id=eq.${encodeURIComponent(user.id)}&limit=1`,
      { headers: { apikey: SUPABASE_KEY, Authorization: authHeader } }
    );
    const entitlements = await entitlementResponse.json();
    const entitlement = Array.isArray(entitlements) ? entitlements[0] : null;
    const active = entitlement?.status === 'active' &&
      (!entitlement.expires_at || new Date(entitlement.expires_at).getTime() > Date.now());
    if (!entitlementResponse.ok || !active) {
      res.status(403).json({ error: 'AI assistant is available with active Sharova Life OS access.' });
      return;
    }

    const { message, context } = req.body || {};
    if (!message || typeof message !== 'string') {
      res.status(400).json({ error: 'A message is required.' });
      return;
    }

    const safeContext = typeof context === 'string' ? context.slice(0, 12000) : '';
    const system = `You are Sharova, a calm and practical personal operating system assistant. Help the user prioritize tasks, deadlines, documents, career, student life, money, travel and home life. Give concise, actionable answers. Never invent data. Use the supplied workspace context when relevant. Do not reveal secrets or API keys.\n\nWorkspace context:\n${safeContext}`;

    // Gemini is the only AI provider for Sharova Life OS.
    // Keep the key server-side in Vercel. Do not fall back to OpenAI.
    const geminiKey = process.env.GEMINI_API_KEY;
    if (!geminiKey) {
      res.status(503).json({ error: 'Sharova AI is temporarily unavailable. Gemini is not configured in the production environment.' });
      return;
    }

    const model = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(geminiKey)}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: system }] },
          contents: [{ role: 'user', parts: [{ text: message }] }],
          generationConfig: { maxOutputTokens: 500 }
        })
      }
    );

    const data = await response.json();
    if (!response.ok) {
      console.error('Gemini request failed', { status: response.status, message: data?.error?.message });
      res.status(response.status || 503).json({
        error: data?.error?.message || 'Sharova AI is temporarily unavailable. Please try again shortly.'
      });
      return;
    }

    const text = data?.candidates?.[0]?.content?.parts?.map(part => part.text || '').filter(Boolean).join('\n');
    if (!text) {
      res.status(503).json({ error: 'Sharova AI did not return a response. Please try again.' });
      return;
    }

    res.status(200).json({ text, provider: 'gemini' });
  } catch (error) {
    console.error('AI handler error', error);
    res.status(500).json({ error: 'The AI service is temporarily unavailable.' });
  }
}
