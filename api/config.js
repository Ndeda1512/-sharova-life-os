const SHAROVA_SUPABASE_URL = 'https://ofodxwpukrgegtavahfm.supabase.co';
const SHAROVA_SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_RvJAQ8p31BacTxANx3gltw_KRxlpoxe';

export default function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  res.setHeader('Cache-Control','no-store');
  res.status(200).json({
    supabaseUrl: SHAROVA_SUPABASE_URL,
    supabaseAnonKey: SHAROVA_SUPABASE_PUBLISHABLE_KEY,
    paymentMode: 'direct',
    price: 47,
    currency: 'USD'
  });
}
