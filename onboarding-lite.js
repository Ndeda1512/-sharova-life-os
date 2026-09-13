/* Sharova Life OS — lightweight onboarding. */
(function(){
  function simplify(){
    const wrap=document.getElementById('studentOnboarding');
    if(!wrap||wrap.dataset.simpleOnboarding==='1')return;
    wrap.dataset.simpleOnboarding='1';
    const heading=wrap.querySelector('h2');
    const intro=wrap.querySelector('.student-onboarding-card > p:not(.eyebrow)');
    if(heading)heading.textContent='What matters most to you right now?';
    if(intro)intro.textContent='Choose your starting point. You can add personal details later — no long setup required.';
    const form=wrap.querySelector('#profileForm');
    if(form){
      form.querySelectorAll('input,.family-note,button[type="submit"]').forEach(el=>el.remove());
      form.style.display='none';
    }
  }
  const observer=new MutationObserver(simplify);
  observer.observe(document.documentElement,{childList:true,subtree:true});
  simplify();
})();
