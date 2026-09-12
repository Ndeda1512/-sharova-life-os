/* Sharova Life OS — authenticated account workspace sync. */
(function(){
  const KEY='sharova-life-os-v1';
  const STUDENT_KEY='sharova-student-v1';
  const PROFILE_KEY='sharova-life-profile-v1';
  let ready=false;
  let timer=null;
  let loading=false;
  const originalSet=localStorage.setItem.bind(localStorage);

  const client=()=>window.SHAROVA_SUPABASE_CLIENT;
  const user=()=>window.SHAROVA_USER;
  const readJson=(key,fallback={})=>{try{const raw=localStorage.getItem(key);return raw?JSON.parse(raw):fallback}catch{return fallback}};

  function workspaceData(){
    return {
      app: readJson(KEY,{}),
      student: readJson(STUDENT_KEY,{}),
      lifeProfile: readJson(PROFILE_KEY,{})
    };
  }

  function restoreWorkspace(data){
    if(!data)return;
    /* New cloud records use explicit namespaces. Older records that stored the
       complete localStorage object are also accepted for compatibility. */
    if(data.app&&typeof data.app==='object') originalSet(KEY,JSON.stringify(data.app));
    if(data.student&&typeof data.student==='object') originalSet(STUDENT_KEY,JSON.stringify(data.student));
    if(data.lifeProfile&&typeof data.lifeProfile==='object') originalSet(PROFILE_KEY,JSON.stringify(data.lifeProfile));
    if(!data.student&&!data.app&&typeof data==='object'){
      /* Legacy fallback: keep the old complete workspace payload intact. */
      originalSet(KEY,JSON.stringify(data));
    }
  }

  async function sync(){
    if(!ready||loading||!client()||!user()?.id)return;
    try{
      const payload=workspaceData();
      const {error}=await client().from('user_workspaces').upsert({
        user_id:user().id,
        data:payload,
        updated_at:new Date().toISOString()
      },{onConflict:'user_id'});
      if(error)throw error;
      window.dispatchEvent(new CustomEvent('sharova-cloud-synced'));
    }catch(e){console.warn('Sharova cloud sync failed',e)}
  }

  function scheduleSync(){
    if(!ready)return;
    clearTimeout(timer);
    timer=setTimeout(sync,400);
  }

  localStorage.setItem=function(k,v){
    originalSet(k,v);
    if((k===KEY||k===STUDENT_KEY||k===PROFILE_KEY)&&ready)scheduleSync();
  };

  window.addEventListener('sharova-auth-ready',async()=>{
    ready=true;
    const c=client(),u=user();
    if(!c||!u?.id)return;

    loading=true;
    try{
      const {data,error}=await c.from('user_workspaces').select('data,updated_at').eq('user_id',u.id).maybeSingle();
      if(error)throw error;

      const local=workspaceData();
      const remote=data?.data;
      const hasLocal=Object.keys(local.app||{}).length||Object.keys(local.student||{}).length||Object.keys(local.lifeProfile||{}).length;

      if(remote){
        /* If this device has never had workspace data, restore the cloud copy.
           If it already has data, prefer the cloud copy because it is the
           account's canonical workspace, then immediately continue syncing. */
        restoreWorkspace(remote);
      }else if(hasLocal){
        await sync();
      }
    }catch(e){
      console.warn('Sharova cloud load failed',e);
    }finally{
      loading=false;
      window.dispatchEvent(new CustomEvent('sharova-cloud-ready'));
    }
  });
})();
