export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const auth = req.headers.authorization || '';
    const accessToken = auth.startsWith('Bearer ') ? auth.slice(7) : '';
    if (!accessToken) return res.status(401).json({ error: 'Authentication required' });
    if (!process.env.STRIPE_SECRET_KEY) return res.status(503).json({ error: 'Checkout is not configured yet.' });

    const supabaseUrl = process.env.SUPABASE_URL || 'https://ofodxwpukrgegtavahfm.supabase.co';
    const supabaseAnonKey = process.env.SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_ANON_KEY || 'sb_publishable_RvJAQ8p31BacTxANx3gltw_KRxlpoxe';
    const userResponse = await fetch(`${supabaseUrl}/auth/v1/user`, {
      headers: { apikey: supabaseAnonKey, Authorization: `Bearer ${accessToken}` }
    });
    const user = await userResponse.json();
    if (!userResponse.ok || !user?.id || !user?.email || !user.email_confirmed_at) {
      return res.status(401).json({ error: 'A verified account is required.' });
    }

    const configuredOrigin = process.env.APP_URL || (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : '');
    const requestOrigin = req.headers.origin || '';
    const origin = configuredOrigin || requestOrigin;
    if (!origin || !/^https:\/\//i.test(origin)) return res.status(500).json({ error: 'Application URL is not configured.' });

    const body = new URLSearchParams();
    body.set('mode', 'payment');
    body.set('success_url', `${origin}/payment-success.html?session_id={CHECKOUT_SESSION_ID}`);
    body.set('cancel_url', `${origin}/`);
    body.set('customer_email', user.email);
    body.set('client_reference_id', user.id);
    body.set('line_items[0][price_data][currency]', 'usd');
    body.set('line_items[0][price_data][product_data][name]', 'Sharova Life OS');
    body.set('line_items[0][price_data][product_data][description]', 'Lifetime access to the Sharova Life OS digital workspace.');
    body.set('line_items[0][price_data][unit_amount]', '4700');
    body.set('line_items[0][quantity]', '1');
    body.set('metadata[user_id]', user.id);
    body.set('metadata[product]', 'sharova_life_os');

    const stripeResponse = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${process.env.STRIPE_SECRET_KEY}`, 'Content-Type': 'application/x-www-form-urlencoded' },
      body
    });
    const session = await stripeResponse.json();
    if (!stripeResponse.ok || !session?.url) return res.status(502).json({ error: 'Unable to start checkout.' });
    return res.status(200).json({ url: session.url });
  } catch (error) {
    console.error('Checkout handler error', error);
    return res.status(500).json({ error: 'Unable to start checkout.' });
  }
}
