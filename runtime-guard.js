/* Sharova Life OS — production safety guard. */
(function(){
  let shown=false;
  function show(){
    if(shown)return;
    shown=true;
    const box=document.createElement('div');
    box.id='sharova-runtime-fallback';
    box.setAttribute('role','alert');
    box.style.cssText='position:fixed;inset:0;z-index:100000;display:flex;align-items:center;justify-content:center;padding:24px;background:#29231f;color:#fffaf5;font-family:system-ui,sans-serif;text-align:center';
    box.innerHTML='<div style="max-width:420px"><div style="font-size:12px;font-weight:800;letter-spacing:.18em;margin-bottom:12px">SHAROVA LIFE OS</div><h1 style="font-size:28px;margin:0 0 10px">Something went wrong.</h1><p style="line-height:1.6;color:#e8ddd5;margin:0 0 20px">We could not load this workspace correctly. Please refresh the page and try again. Your saved account data is not affected.</p><button id="sharova-runtime-retry" style="border:0;border-radius:10px;padding:13px 18px;background:#fffaf5;color:#29231f;font-weight:800;cursor:pointer">Refresh Sharova</button></div>';
    document.body.appendChild(box);
    const retry=document.getElementById('sharova-runtime-retry');
    if(retry)retry.onclick=()=>location.reload();
  }
  function directCheckout(card){
    const buy=card.querySelector('#shaDirectBuy');
    if(!buy)return;
    buy.onclick=async()=>{
      buy.disabled=true;
      const msg=card.querySelector('#shaDirectMsg');
      if(msg)msg.textContent='Opening secure checkout…';
      try{
        const client=window.SHAROVA_SUPABASE_CLIENT;
        const {data:{session}}=await client.auth.getSession();
        if(!session?.access_token)throw new Error('Please log in again.');
        const r=await fetch('/api/create-checkout',{method:'POST',headers:{Authorization:`Bearer ${session.access_token}`}});
        const d=await r.json().catch(()=>({}));
        if(!r.ok||!d.url)throw new Error(d.error||'Unable to start checkout.');
        location.href=d.url;
      }catch(e){
        console.error('Sharova checkout error',e);
        if(msg)msg.textContent='We could not open checkout. Please try again.';
        buy.disabled=false;
      }
    };
  }
  function fixStalePaywall(){
    const gate=document.getElementById('sharova-auth-gate');
    const card=gate?.querySelector('.sha-card');
    if(!card)return;
    const text=card.textContent||'';
    if(!/Creative Market|activation code|already paid for your access/i.test(text))return;
    card.innerHTML='<div class="sha-brand">SHAROVA LIFE OS</div><h1>Unlock your Life OS.</h1><p class="sha-sub">Your account is ready. Buy Sharova Life OS directly here for a one-time $47 payment. Creative Market is only one of our sales channels; direct buyers do not need an activation code.</p><div class="sha-price">$47 <span style="font-size:12px;font-weight:700">one time</span></div><div class="sha-note"><strong>Secure checkout:</strong> payment is handled by Stripe. Your card details are not stored by Sharova.</div><div class="sha-form"><div id="shaDirectMsg" class="sha-msg"></div><button id="shaDirectBuy" class="sha-primary" type="button">Buy &amp; unlock Sharova</button><button id="shaDirectLogout" class="sha-secondary" type="button">Log out</button></div>';
    directCheckout(card);
    const logout=card.querySelector('#shaDirectLogout');
    if(logout)logout.onclick=async()=>{try{await window.SHAROVA_SUPABASE_CLIENT?.auth.signOut()}finally{location.reload()}};
  }
  function watch(){
    fixStalePaywall();
    const observer=new MutationObserver(fixStalePaywall);
    observer.observe(document.documentElement,{subtree:true,childList:true,characterData:true});
    setInterval(fixStalePaywall,500);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',watch,{once:true});
  else watch();
  window.addEventListener('error',function(e){console.error('Sharova runtime error',e.error||e.message);show()});
  window.addEventListener('unhandledrejection',function(e){console.error('Sharova unhandled promise rejection',e.reason);show()});
})();
