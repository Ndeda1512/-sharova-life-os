import crypto from 'node:crypto';

export const config = { api: { bodyParser: false } };

function verifySignature(payload, signature, secret) {
  if (!signature || !secret) return false;
  const expected = crypto.createHmac('sha512', secret).update(payload).digest('hex');
  try {
    const a = Buffer.from(expected, 'utf8');
    const b = Buffer.from(signature, 'utf8');
    return a.length === b.length && crypto.timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

function readMetadata(metadata) {
  if (!metadata) return {};
  if (typeof metadata === 'object') return metadata;
  try { return JSON.parse(metadata); } catch { return {}; }
}

async function grantEntitlement(transaction) {
  const metadata = readMetadata(transaction?.metadata);
  const userId = metadata.user_id;
  if (!userId) throw new Error('Missing user id');

  const supabaseUrl = 'https://ofodxwpukrgegtavahfm.supabase.co';
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) throw new Error('Webhook service is not configured');

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
      provider: 'paystack',
      provider_customer_id: transaction?.customer?.customer_code || null,
      expires_at: null,
      updated_at: new Date().toISOString()
    })
  });

  if (!response.ok) {
    const text = await response.text();
    console.error('Entitlement update failed', text);
    throw new Error('Entitlement update failed');
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  try {
    const chunks = [];
    for await (const chunk of req) chunks.push(chunk);
    const rawBody = Buffer.concat(chunks).toString('utf8');

    if (!verifySignature(rawBody, req.headers['x-paystack-signature'], process.env.PAYSTACK_SECRET_KEY)) {
      return res.status(400).json({ error: 'Invalid signature' });
    }

    const event = JSON.parse(rawBody);
    const transaction = event?.data;
    const metadata = readMetadata(transaction?.metadata);
    const validProduct = metadata.product === 'sharova_life_os';
    const validCurrency = transaction?.currency === 'USD';
    const validAmount = Number(transaction?.amount) === 4700;

    if (event?.event === 'charge.success' && transaction?.status === 'success' && validProduct && validCurrency && validAmount) {
      await grantEntitlement(transaction);
    }

    return res.status(200).json({ received: true });
  } catch (error) {
    console.error('Paystack webhook error', error);
    return res.status(500).json({ error: 'Webhook processing failed' });
  }
}
