import crypto from 'node:crypto';

function verifyStripeSignature(payload, signature, secret) {
  if (!secret || !signature) return false;
  const parts=signature.split(',').reduce((out,part)=>{const [key,value]=part.split('=',2);if(key==='v1')(out.v1 ||= []).push(value);else out[key]=value;return out},{});
  const timestamp=parts.t;if(!timestamp||!Array.isArray(parts.v1)||!parts.v1.length)return false;
  if(Math.abs(Date.now()/1000-Number(timestamp))>300)return false;
  const expected=crypto.createHmac('sha256',secret).update(`${timestamp}.${payload}`).digest('hex');
  return parts.v1.some(received=>{try{const a=Buffer.from(expected,'utf8'),b=Buffer.from(received||'','utf8');return a.length===b.length&&crypto.timingSafeEqual(a,b)}catch{return false}});
}

export const config={api:{bodyParser:false}};

async function grantEntitlement(session){
  const userId=session.metadata?.user_id||session.client_reference_id;
  if(!userId)throw new Error('Missing user id');
  const supabaseUrl='https://ofodxwpukrgegtavahfm.supabase.co';
  const serviceKey=process.env.SUPABASE_SERVICE_ROLE_KEY;
  if(!serviceKey)throw new Error('Webhook service is not configured');
  const response=await fetch(`${supabaseUrl}/rest/v1/user_entitlements?on_conflict=user_id`,{method:'POST',headers:{apikey:serviceKey,Authorization:`Bearer ${serviceKey}`,'Content-Type':'application/json',Prefer:'resolution=merge-duplicates,return=minimal'},body:JSON.stringify({user_id:userId,status:'active',plan:'lifetime',provider:'stripe',provider_customer_id:session.customer||null,expires_at:null,updated_at:new Date().toISOString()})});
  if(!response.ok){const text=await response.text();console.error('Entitlement update failed',text);throw new Error('Entitlement update failed')}
}

export default async function handler(req,res){
  if(req.method!=='POST')return res.status(405).end();
  try{
    const chunks=[];for await(const chunk of req)chunks.push(chunk);const rawBody=Buffer.concat(chunks).toString('utf8');
    if(!verifyStripeSignature(rawBody,req.headers['stripe-signature'],process.env.STRIPE_WEBHOOK_SECRET))return res.status(400).json({error:'Invalid signature'});
    const event=JSON.parse(rawBody);const session=event.data?.object;
    if(event.type==='checkout.session.completed'&&session?.payment_status==='paid')await grantEntitlement(session);
    if(event.type==='checkout.session.async_payment_succeeded')await grantEntitlement(session);
    return res.status(200).json({received:true});
  }catch(error){console.error('Stripe webhook error',error);return res.status(500).json({error:'Webhook processing failed'})}
}
