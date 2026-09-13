/* Sharova Life OS — friendly production error boundary. */
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
  window.addEventListener('error',function(e){
    console.error('Sharova runtime error',e.error||e.message);
    show();
  });
  window.addEventListener('unhandledrejection',function(e){
    console.error('Sharova unhandled promise rejection',e.reason);
    show();
  });
})();
