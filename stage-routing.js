/* Sharova Life OS — life-stage selection routing fix v3. */
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

  const profileFromStorage=()=>{
    try{return JSON.parse(localStorage.getItem(PROFILE_KEY)||'{}')||{}}
    catch{return {}}
  };

  function saveStage(stage,wrap){
    const current=profileFromStorage();
    const student=wrap?.querySelector('#profileStudent')?.value?.trim()||current.managedStudent||'';
    const school=wrap?.querySelector('#profileSchool')?.value?.trim()||current.school||'';
    const term=wrap?.querySelector('#profileTerm')?.value?.trim()||current.term||'';
    const profile={stage,managedStudent:student,school,term};
    localStorage.setItem(PROFILE_KEY,JSON.stringify(profile));
    try{
      const studentRaw=JSON.parse(localStorage.getItem('sharova-student-v1')||'null');
      if(studentRaw){
        studentRaw.profile={...(studentRaw.profile||{}),...profile};
        localStorage.setItem('sharova-student-v1',JSON.stringify(studentRaw));
      }
    }catch{}
  }

  function navigate(id){
    const target=document.getElementById(id);
    if(!target){
      location.hash=id;
      return;
    }
    location.hash=id;
    target.scrollIntoView({behavior:'smooth',block:'start'});
    setTimeout(()=>window.scrollBy(0,-16),60);
    window.dispatchEvent(new CustomEvent('sharova-life-stage-navigated',{detail:{target:id}}));
  }

  function go(stage){
    const target=routes[stage]||'home';
    const wrap=document.getElementById('studentOnboarding');
    saveStage(stage,wrap);
    if(wrap)wrap.remove();
    requestAnimationFrame(()=>navigate(target));
    window.dispatchEvent(new CustomEvent('sharova-life-stage-selected',{detail:{stage,target}}));
  }

  // Event delegation makes every current and dynamically-created stage button work.
  document.addEventListener('click',event=>{
    const button=event.target.closest?.('.stage-option');
    if(!button)return;
    const stage=button.dataset.stage;
    if(!stage)return;
    event.preventDefault();
    event.stopImmediatePropagation();
    go(stage);
  },true);
})();
