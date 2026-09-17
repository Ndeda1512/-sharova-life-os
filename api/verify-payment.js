export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const auth = req.headers.authorization || '';
    const accessToken = auth.startsWith('Bearer ') ? auth.slice(7) : '';
    if (!accessToken) return res.status(401).json({ error: 'Authentication required' });
    if (!process.env.PAYSTACK_SECRET_KEY) return res.status(503).json({ error: 'Payment is not configured yet.' });

    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
    const reference = String(body.reference || '').trim();
    if (!reference) return res.status(400).json({ error: 'Payment reference is required.' });

    const supabaseUrl = 'https://ofodxwpukrgegtavahfm.supabase.co';
    const supabaseAnonKey = 'sb_publishable_RvJAQ8p31BacTxANx3gltw_KRxlpoxe';
    const userResponse = await fetch(`${supabaseUrl}/auth/v1/user`, {
      headers: { apikey: supabaseAnonKey, Authorization: `Bearer ${accessToken}` }
    });
    const user = await userResponse.json().catch(() => ({}));
    if (!userResponse.ok || !user?.id || !user?.email) return res.status(401).json({ error: 'Authentication required.' });

    const verifyResponse = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`, {
      headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}` }
    });
    const result = await verifyResponse.json().catch(() => ({}));
    const transaction = result?.data;
    const expectedAmount = 4700;
    const valid = verifyResponse.ok && result?.status && transaction?.status === 'success' && transaction?.currency === 'USD' && Number(transaction?.amount) === expectedAmount && transaction?.metadata?.product === 'sharova_life_os' && transaction?.metadata?.user_id === user.id;

    if (!valid) return res.status(400).json({ error: 'Payment could not be verified.' });

    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!serviceKey) return res.status(503).json({ error: 'Payment verification is not configured yet.' });

    const entitlementResponse = await fetch(`${supabaseUrl}/rest/v1/user_entitlements?on_conflict=user_id`, {
      method: 'POST',
      headers: {
        apikey: serviceKey,
        Authorization: `Bearer ${serviceKey}`,
        'Content-Type': 'application/json',
        Prefer: 'resolution=merge-duplicates,return=minimal'
      },
      body: JSON.stringify({
        user_id: user.id,
        status: 'active',
        plan: 'lifetime',
        provider: 'paystack',
        provider_customer_id: transaction?.customer?.customer_code || null,
        expires_at: null,
        updated_at: new Date().toISOString()
      })
    });

    if (!entitlementResponse.ok) return res.status(502).json({ error: 'Payment verified, but account access could not be updated yet.' });
    return res.status(200).json({ verified: true });
  } catch (error) {
    console.error('Paystack verification error', error);
    return res.status(500).json({ error: 'Unable to verify payment.' });
  }
}
