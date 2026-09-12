// Sharova Life OS — authenticated AI assistant client.
(() => {
  const form = document.getElementById('chatForm');
  const input = document.getElementById('chatInput');
  const log = document.getElementById('chatLog');
  if (!form || !input || !log) return;

  const KEY = 'sharova-life-os-v1';
  const readState = () => { try { return JSON.parse(localStorage.getItem(KEY) || '{}'); } catch { return {}; } };
  const esc = value => String(value ?? '').replace(/[&<>\"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
  const addMessage = (text, role) => {
    const el = document.createElement('div');
    el.className = role === 'user' ? 'user-message' : 'assistant-message';
    el.innerHTML = esc(text).replace(/\n/g, '<br>');
    log.appendChild(el);
    log.scrollTop = log.scrollHeight;
  };
  const context = () => {
    const s = readState();
    return JSON.stringify({
      tasks:(s.tasks||[]).slice(0,40),
      deadlines:(s.deadlines||[]).slice(0,40),
      documents:(s.documents||[]).slice(0,40),
      career:(s.career||[]).slice(0,40),
      money:(s.money||[]).slice(0,60),
      trips:(s.trips||[]).slice(0,20),
      settings:{currency:s.settings?.currency||'KSh'}
    });
  };

  form.addEventListener('submit', async event => {
    event.preventDefault();
    event.stopImmediatePropagation();
    const message = input.value.trim();
    if (!message) return;
    input.value = '';
    addMessage(message, 'user');
    const typing = document.createElement('div');
    typing.className = 'assistant-message';
    typing.textContent = 'Thinking…';
    log.appendChild(typing);
    log.scrollTop = log.scrollHeight;

    try {
      if (!window.SHAROVA_SUPABASE_CLIENT) throw new Error('Account service is not ready.');
      const {data: sessionData, error: sessionError} = await window.SHAROVA_SUPABASE_CLIENT.auth.getSession();
      if (sessionError || !sessionData.session) throw new Error('Please log in again.');
      const response = await fetch('/api/ai', {
        method:'POST',
        headers:{'Content-Type':'application/json','Authorization':`Bearer ${sessionData.session.access_token}`},
        body:JSON.stringify({message,context:context()})
      });
      const data = await response.json().catch(() => ({}));
      typing.remove();
      if (!response.ok) throw new Error(data.error || 'AI service is not available.');
      addMessage(data.text || 'I could not generate a response.', 'assistant');
    } catch (error) {
      typing.remove();
      addMessage(error.message || 'The AI service is temporarily unavailable.', 'assistant');
    }
  }, true);
})();
