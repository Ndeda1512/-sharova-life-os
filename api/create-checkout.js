export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const auth = req.headers.authorization || '';
    const accessToken = auth.startsWith('Bearer ') ? auth.slice(7) : '';
    if (!accessToken) return res.status(401).json({ error: 'Authentication required' });
    if (!process.env.PAYSTACK_SECRET_KEY) return res.status(503).json({ error: 'Payment is not configured yet.' });

    const supabaseUrl = 'https://ofodxwpukrgegtavahfm.supabase.co';
    const supabaseAnonKey = 'sb_publishable_RvJAQ8p31BacTxANx3gltw_KRxlpoxe';
    const userResponse = await fetch(`${supabaseUrl}/auth/v1/user`, {
      headers: { apikey: supabaseAnonKey, Authorization: `Bearer ${accessToken}` }
    });
    const user = await userResponse.json();
    const confirmed = user?.email_confirmed_at || user?.confirmed_at;
    if (!userResponse.ok || !user?.id || !user?.email || !confirmed) {
      return res.status(401).json({ error: 'A verified account is required. Please confirm your email, then log in again.' });
    }

    const configuredOrigin = process.env.APP_URL || (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : '');
    const requestOrigin = req.headers.origin || '';
    const origin = configuredOrigin || requestOrigin;
    if (!origin || !/^https:\/\//i.test(origin)) return res.status(500).json({ error: 'Application URL is not configured.' });

    const response = await fetch('https://api.paystack.co/transaction/initialize', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: user.email,
        amount: 4700,
        currency: 'USD',
        callback_url: `${origin}/payment-success.html`,
        metadata: {
          user_id: user.id,
          product: 'sharova_life_os',
          plan: 'lifetime'
        },
        // USD checkout is card-based for Kenya.
        channels: ['card']
      })
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok || !data?.status || !data?.data?.authorization_url) {
      console.error('Paystack initialization failed', data);
      return res.status(502).json({ error: data?.message || 'Unable to start payment.' });
    }

    return res.status(200).json({ url: data.data.authorization_url, reference: data.data.reference });
  } catch (error) {
    console.error('Paystack checkout handler error', error);
    return res.status(500).json({ error: 'Unable to start payment.' });
  }
}
