export default function handler(req, res) {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const mode = process.env.PAYMENT_MODE === 'direct' ? 'direct' : 'activation_code';
  res.setHeader('Cache-Control', 'no-store');
  res.status(200).json({
    paymentMode: mode,
    price: 47,
    currency: 'USD'
  });
}
