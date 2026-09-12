const json = (statusCode, body) => ({
  statusCode,
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(body)
});

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') return json(405, { error: 'Method not allowed' });

  try {
    const auth = event.headers?.authorization || event.headers?.Authorization || '';
    const accessToken = auth.startsWith('Bearer ') ? auth.slice(7) : '';
    if (!accessToken) return json(401, { error: 'Authentication required' });
    if (!process.env.STRIPE_SECRET_KEY) return json(503, { error: 'Checkout is not configured yet.' });

    const supabaseUrl = process.env.SUPABASE_URL || 'https://ofodxwpukrgegtavahfm.supabase.co';
    const supabaseAnonKey = process.env.SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_ANON_KEY || 'sb_publishable_RvJAQ8p31BacTxANx3gltw_KRxlpoxe';
    const userResponse = await fetch(`${supabaseUrl}/auth/v1/user`, {
      headers: { apikey: supabaseAnonKey, Authorization: `Bearer ${accessToken}` }
    });
    const user = await userResponse.json();
    if (!userResponse.ok || !user?.id || !user?.email || !user.email_confirmed_at) {
      return json(401, { error: 'A verified account is required.' });
    }

    const configuredOrigin = process.env.APP_URL || '';
    const requestOrigin = event.headers?.origin || event.headers?.Origin || '';
    const origin = configuredOrigin || requestOrigin;
    if (!origin || !/^https:\/\//i.test(origin)) return json(500, { error: 'Application URL is not configured.' });

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
    if (!stripeResponse.ok || !session?.url) return json(502, { error: 'Unable to start checkout.' });
    return json(200, { url: session.url });
  } catch (error) {
    console.error('Checkout handler error', error);
    return json(500, { error: 'Unable to start checkout.' });
  }
};
