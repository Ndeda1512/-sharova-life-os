import crypto from 'crypto';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const webhookKey = process.env.PAYHIP_WEBHOOK_KEY;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!webhookKey || !serviceKey) return res.status(503).json({ error: 'Webhook is not configured.' });

    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
    const signature = String(body.signature || '').trim().toLowerCase();
    const expected = crypto.createHash('sha256').update(webhookKey).digest('hex');
    const validSignature = signature.length === expected.length && crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
    if (!validSignature) return res.status(401).json({ error: 'Invalid signature.' });

    const type = String(body.type || '');
    const items = Array.isArray(body.items) ? body.items : [];
    const isSharova = items.some((item) =>
      String(item.product_permalink || '').endsWith('/b/PjDWH') ||
      String(item.product_name || '').trim().toLowerCase() === 'sharova life os — your personal digital life system' ||
      /sharova life os/i.test(String(item.product_name || ''))
    );
    if (!isSharova) return res.status(200).json({ ignored: true });

    const supabaseUrl = 'https://ofodxwpukrgegtavahfm.supabase.co';
    const transactionId = String(body.id || '').trim();
    const email = String(body.email || '').trim().toLowerCase();
    if (!transactionId || !email) return res.status(400).json({ error: 'Missing transaction details.' });

    const product = items.find((item) =>
      String(item.product_permalink || '').endsWith('/b/PjDWH') ||
      String(item.product_name || '').trim().toLowerCase() === 'sharova life os — your personal digital life system' ||
      /sharova life os/i.test(String(item.product_name || ''))
    ) || items[0];

    const isPaid = type === 'paid';
    const isRefunded = type === 'refunded';

    const response = await fetch(`${supabaseUrl}/rest/v1/payhip_purchases?on_conflict=transaction_id`, {
      method: 'POST',
      headers: {
        apikey: serviceKey,
        Authorization: `Bearer ${serviceKey}`,
        'Content-Type': 'application/json',
        Prefer: 'resolution=merge-duplicates,return=minimal'
      },
      body: JSON.stringify({
        transaction_id: transactionId,
        email,
        product_id: String(product?.product_id || ''),
        product_name: String(product?.product_name || 'Sharova Life OS'),
        status: isPaid ? 'paid' : (isRefunded ? 'refunded' : type || 'unknown'),
        paid_at: isPaid ? new Date(Number(body.date || Date.now()) * 1000).toISOString() : undefined,
        refunded_at: isRefunded ? new Date(Number(body.date_refunded || Date.now()) * 1000).toISOString() : null,
        payload: body,
        updated_at: new Date().toISOString()
      })
    });

    if (!response.ok) {
      const detail = await response.text();
      console.error('Payhip purchase storage failed', detail);
      return res.status(502).json({ error: 'Could not store purchase.' });
    }

    return res.status(200).json({ received: true });
  } catch (error) {
    console.error('Payhip webhook error', error);
    return res.status(500).json({ error: 'Webhook processing failed.' });
  }
}
