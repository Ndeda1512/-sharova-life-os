/* Sharova Life OS — life-stage navigation fix v4.
   Every stage button must immediately open its destination. */
(function(){
  const PROFILE_KEY='sharova-life-profile-v1';
  const routes={
    'Student':'student-life',
    'University Student':'student-life',
    'Job Seeker':'career',
    'Working Professional':'home-life',
    'Entrepreneur':'money',
    'Parent / Family':'student-life',
    'Other':'home'
  };

  function readProfile(){
    try{return JSON.parse(localStorage.getItem(PROFILE_KEY)||'{}')||{}}catch{return {}}
  }

  function saveStage(stage,wrap){
    const old=readProfile();
    const profile={
      ...old,
      stage,
      managedStudent:wrap?.querySelector('#profileStudent')?.value?.trim()||old.managedStudent||'',
      school:wrap?.querySelector('#profileSchool')?.value?.trim()||old.school||'',
      term:wrap?.querySelector('#profileTerm')?.value?.trim()||old.term||''
    };
    try{localStorage.setItem(PROFILE_KEY,JSON.stringify(profile))}catch{}
    try{
      const raw=JSON.parse(localStorage.getItem('sharova-student-v1')||'null');
      if(raw){raw.profile={...(raw.profile||{}),...profile};localStorage.setItem('sharova-student-v1',JSON.stringify(raw))}
    }catch{}
  }

  function openDestination(id){
    const go=()=>{
      const target=document.getElementById(id);
      if(!target){
        location.hash='#'+id;
        return;
      }
      history.replaceState(null,'','#'+id);
      target.scrollIntoView({behavior:'smooth',block:'start'});
      setTimeout(()=>window.scrollBy(0,-20),80);
      window.dispatchEvent(new CustomEvent('sharova-life-stage-navigated',{detail:{target:id}}));
    };
    requestAnimationFrame(go);
    setTimeout(go,150);
  }

  function choose(stage,button){
    const target=routes[stage]||'home';
    const wrap=document.getElementById('studentOnboarding');
    saveStage(stage,wrap);
    if(button){
      document.querySelectorAll('.stage-option').forEach(b=>b.classList.remove('active'));
      button.classList.add('active');
    }
    if(wrap)wrap.remove();
    openDestination(target);
    window.dispatchEvent(new CustomEvent('sharova-life-stage-selected',{detail:{stage,target}}));
  }

  function bind(){
    document.querySelectorAll('.stage-option').forEach(button=>{
      if(button.dataset.stageBound==='1')return;
      button.dataset.stageBound='1';
      button.type='button';
      button.addEventListener('click',function(event){
        event.preventDefault();
        event.stopPropagation();
        choose(this.dataset.stage,this);
      },true);
    });
  }

  const observer=new MutationObserver(bind);
  observer.observe(document.documentElement,{childList:true,subtree:true});
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',bind);else bind();
})();
