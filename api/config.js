export default function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  res.setHeader('Cache-Control','no-store');
  res.status(200).json({
    supabaseUrl: process.env.SUPABASE_URL || 'https://ofodxwpukrgegtavahfm.supabase.co',
    supabaseAnonKey: process.env.SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_ANON_KEY || '',
    paymentMode: 'direct',
    price: 47,
    currency: 'USD'
  });
}
