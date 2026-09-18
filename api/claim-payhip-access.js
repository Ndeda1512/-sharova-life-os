export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const auth = req.headers.authorization || '';
    const accessToken = auth.startsWith('Bearer ') ? auth.slice(7) : '';
    if (!accessToken) return res.status(401).json({ error: 'Authentication required.' });

    const supabaseUrl = 'https://ofodxwpukrgegtavahfm.supabase.co';
    const supabaseAnonKey = 'sb_publishable_RvJAQ8p31BacTxANx3gltw_KRxlpoxe';
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!serviceKey) return res.status(503).json({ error: 'Access service is not configured yet.' });

    const userResponse = await fetch(`${supabaseUrl}/auth/v1/user`, {
      headers: { apikey: supabaseAnonKey, Authorization: `Bearer ${accessToken}` }
    });
    const user = await userResponse.json().catch(() => ({}));
    if (!userResponse.ok || !user?.id || !user?.email) return res.status(401).json({ error: 'Authentication required.' });

    const email = String(user.email).trim().toLowerCase();
    const purchaseResponse = await fetch(
      `${supabaseUrl}/rest/v1/payhip_purchases?select=transaction_id,status,product_name,paid_at,refunded_at&email=ilike.${encodeURIComponent(email)}&order=updated_at.desc&limit=1`,
      { headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` } }
    );
    const purchases = await purchaseResponse.json().catch(() => []);
    if (!purchaseResponse.ok) return res.status(502).json({ error: 'Could not check purchase access.' });

    const purchase = purchases?.[0];
    if (!purchase) return res.status(200).json({ entitled: false });

    const active = purchase.status === 'paid' && !purchase.refunded_at;
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
        status: active ? 'active' : 'inactive',
        plan: active ? 'lifetime' : null,
        provider: active ? 'payhip' : 'payhip',
        provider_customer_id: purchase.transaction_id || null,
        expires_at: null,
        updated_at: new Date().toISOString()
      })
    });

    if (!entitlementResponse.ok) return res.status(502).json({ error: 'Purchase found, but account access could not be updated.' });
    return res.status(200).json({ entitled: active });
  } catch (error) {
    console.error('Payhip access claim error', error);
    return res.status(500).json({ error: 'Unable to check purchase access.' });
  }
}
