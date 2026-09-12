const crypto = require('node:crypto');

const json = (statusCode, body) => ({
  statusCode,
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(body)
});

function verifyStripeSignature(payload, signature, secret) {
  if (!secret || !signature) return false;
  const parts = signature.split(',').reduce((out, part) => {
    const [key, value] = part.split('=', 2);
    if (key === 'v1') (out.v1 ||= []).push(value);
    else out[key] = value;
    return out;
  }, {});
  const timestamp = parts.t;
  if (!timestamp || !Array.isArray(parts.v1) || !parts.v1.length) return false;
  if (Math.abs(Date.now() / 1000 - Number(timestamp)) > 300) return false;
  const expected = crypto.createHmac('sha256', secret).update(`${timestamp}.${payload}`).digest('hex');
  return parts.v1.some(received => {
    try {
      const a = Buffer.from(expected, 'utf8');
      const b = Buffer.from(received || '', 'utf8');
      return a.length === b.length && crypto.timingSafeEqual(a, b);
    } catch { return false; }
  });
}

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: '' };

  try {
    const rawBody = event.isBase64Encoded
      ? Buffer.from(event.body || '', 'base64').toString('utf8')
      : (event.body || '');
    const signature = event.headers?.['stripe-signature'] || event.headers?.['Stripe-Signature'] || '';
    if (!verifyStripeSignature(rawBody, signature, process.env.STRIPE_WEBHOOK_SECRET)) {
      return json(400, { error: 'Invalid signature' });
    }

    const eventData = JSON.parse(rawBody);
    if (eventData.type === 'checkout.session.completed') {
      const session = eventData.data.object;
      const userId = session.metadata?.user_id || session.client_reference_id;
      if (userId) {
        const supabaseUrl = process.env.SUPABASE_URL || 'https://ofodxwpukrgegtavahfm.supabase.co';
        const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
        if (!serviceKey) return json(500, { error: 'Webhook service is not configured' });
        const response = await fetch(`${supabaseUrl}/rest/v1/user_entitlements?on_conflict=user_id`, {
          method: 'POST',
          headers: {
            apikey: serviceKey,
            Authorization: `Bearer ${serviceKey}`,
            'Content-Type': 'application/json',
            Prefer: 'resolution=merge-duplicates,return=minimal'
          },
          body: JSON.stringify({
            user_id: userId,
            status: 'active',
            plan: 'lifetime',
            provider: 'stripe',
            provider_customer_id: session.customer || null,
            expires_at: null,
            updated_at: new Date().toISOString()
          })
        });
        if (!response.ok) return json(500, { error: 'Entitlement update failed' });
      }
    }

    return json(200, { received: true });
  } catch (error) {
    console.error('Stripe webhook error', error);
    return json(500, { error: 'Webhook processing failed' });
  }
};
