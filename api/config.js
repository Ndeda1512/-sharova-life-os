export default function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  const referer=String(req.headers.referer||'');
  const directEdition=process.env.PAYMENT_MODE==='direct'||/[?&]edition=direct(?:&|$)/i.test(referer);
  res.setHeader('Cache-Control','no-store');
  res.status(200).json({
    supabaseUrl: process.env.SUPABASE_URL || 'https://ofodxwpukrgegtavahfm.supabase.co',
    supabaseAnonKey: process.env.SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_ANON_KEY || '',
    paymentMode: directEdition ? 'direct' : 'activation_code',
    price: 47,
    currency: 'USD'
  });
}
