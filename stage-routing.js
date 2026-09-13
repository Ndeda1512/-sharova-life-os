/* Sharova Life OS — life-stage selection routing fix. */
(function(){
  const PROFILE_KEY='sharova-life-profile-v1';
  const routes={
    'Student':'student-life',
    'University Student':'student-life',
    'Job Seeker':'career',
    'Working Professional':'home',
    'Entrepreneur':'money',
    'Parent / Family':'student-life',
    'Other':'home'
  };
  const profileFromStorage=()=>{try{return JSON.parse(localStorage.getItem(PROFILE_KEY)||'{}')}catch{return {}}};
  function saveStage(stage,wrap){
    const current=profileFromStorage();
    const student=wrap?.querySelector('#profileStudent')?.value?.trim()||current.managedStudent||'';
    const school=wrap?.querySelector('#profileSchool')?.value?.trim()||current.school||'';
    const term=wrap?.querySelector('#profileTerm')?.value?.trim()||current.term||'';
    localStorage.setItem(PROFILE_KEY,JSON.stringify({stage,managedStudent:student,school,term}));
  }
  function go(stage,button){
    const wrap=document.getElementById('studentOnboarding');
    saveStage(stage,wrap);
    if(wrap)wrap.remove();
    const id=routes[stage]||'home';
    const target=document.getElementById(id);
    if(target){
      history.replaceState(null,'','#'+id);
      requestAnimationFrame(()=>target.scrollIntoView({behavior:'smooth',block:'start'}));
    }else{
      location.hash=id;
    }
    window.dispatchEvent(new CustomEvent('sharova-life-stage-selected',{detail:{stage,target:id}}));
  }
  function bind(root){
    root.querySelectorAll?.('.stage-option').forEach(button=>{
      if(button.dataset.stageRoutingBound==='1')return;
      button.dataset.stageRoutingBound='1';
      button.addEventListener('click',()=>go(button.dataset.stage,button));
    });
  }
  const observer=new MutationObserver(()=>bind(document));
  observer.observe(document.documentElement,{childList:true,subtree:true});
  bind(document);
})();
