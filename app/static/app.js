(() => {
  const input = document.getElementById('chat-input');
  const send = document.getElementById('send-chat');
  const log = document.getElementById('chat-log');
  const language = document.getElementById('language');
  const voiceInput = document.getElementById('voice-input');
  const speakLast = document.getElementById('speak-last');
  const stopSpeech = document.getElementById('stop-speech');
  const autoSpeak = document.getElementById('auto-speak');
  const voiceStatus = document.getElementById('voice-status');
  let lastReply = '';
  function addBubble(text, who) { if (!log) return; const div = document.createElement('div'); div.className = `chat-bubble ${who}`; div.textContent = text; log.appendChild(div); log.scrollTop = log.scrollHeight; }
  async function sendMessage() {
    if (!input || !input.value.trim()) return;
    const message = input.value.trim(); input.value = ''; addBubble(message, 'user');
    send.disabled = true;
    try {
      const response = await fetch('/api/chat', {method:'POST', headers:{'Content-Type':'application/json','X-Requested-With':'ReviewPilotAI'}, body:JSON.stringify({message, language:language?.value || 'en'})});
      if (response.status === 401 || response.redirected) { window.location.href='/login'; return; }
      const data = await response.json(); lastReply = data.reply || 'No response received.'; addBubble(lastReply, 'bot'); if (autoSpeak?.checked) speakText(lastReply);
    } catch { lastReply = 'Could not connect to the chat service. Please try again.'; addBubble(lastReply, 'bot'); }
    finally { send.disabled = false; input.focus(); }
  }
  if (send) send.addEventListener('click', sendMessage);
  if (input) input.addEventListener('keydown', e => { if (e.key === 'Enter') sendMessage(); });
  function locale() { return ({en:'en-IN', ta:'ta-IN', hi:'hi-IN'})[language?.value || 'en']; }
  let currentAudio = null;
  async function speakText(text) {
    if (voiceStatus) voiceStatus.textContent = 'Preparing voice…';
    try {
      const response = await fetch('/api/tts', {method:'POST', headers:{'Content-Type':'application/json','X-Requested-With':'ReviewPilotAI'}, body:JSON.stringify({text, language:language?.value || 'en'})});
      if (response.ok && response.headers.get('content-type')?.includes('audio/')) {
        if (currentAudio) { currentAudio.pause(); currentAudio = null; }
        if ('speechSynthesis' in window) window.speechSynthesis.cancel();
        const blob = await response.blob(); const objectUrl = URL.createObjectURL(blob); currentAudio = new Audio(objectUrl);
        currentAudio.onended = () => { URL.revokeObjectURL(objectUrl); currentAudio = null; if (voiceStatus) voiceStatus.textContent = 'Finished speaking.'; };
        currentAudio.onerror = () => { URL.revokeObjectURL(objectUrl); currentAudio = null; browserSpeak(text); };
        await currentAudio.play(); if (voiceStatus) voiceStatus.textContent = 'Speaking with natural voice…'; return;
      }
    } catch (_) { /* Fall back to browser speech if provider is not configured or unavailable. */ }
    browserSpeak(text);
  }
  function browserSpeak(text) {
    if (!('speechSynthesis' in window)) { if (voiceStatus) voiceStatus.textContent = 'Speech output is not supported in this browser.'; return; }
    if (currentAudio) { currentAudio.pause(); currentAudio = null; }
    window.speechSynthesis.cancel(); const utterance = new SpeechSynthesisUtterance(text); utterance.lang = locale(); utterance.rate = 1; window.speechSynthesis.speak(utterance);
    if (voiceStatus) voiceStatus.textContent = 'Speaking with browser voice…'; utterance.onend = () => { if (voiceStatus) voiceStatus.textContent = 'Finished speaking.'; };
  }
  if (speakLast) speakLast.addEventListener('click', () => { if (!lastReply) { if (voiceStatus) voiceStatus.textContent = 'Send a message first.'; return; } speakText(lastReply); });
  if (stopSpeech) stopSpeech.addEventListener('click', () => { if ('speechSynthesis' in window) window.speechSynthesis.cancel(); if (currentAudio) { currentAudio.pause(); currentAudio = null; } if (voiceStatus) voiceStatus.textContent = 'Speech stopped.'; });
  if (voiceInput) voiceInput.addEventListener('click', () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) { if (voiceStatus) voiceStatus.textContent = 'Speech recognition is unavailable. Try a supported browser such as Chrome.'; return; }
    const recognition = new SpeechRecognition(); recognition.lang = locale(); recognition.interimResults = false; recognition.maxAlternatives = 1;
    voiceInput.disabled = true; if (voiceStatus) voiceStatus.textContent = 'Listening…';
    recognition.onresult = event => { if (input) input.value = event.results[0][0].transcript; if (voiceStatus) voiceStatus.textContent = 'Speech captured. Press Send to submit.'; };
    recognition.onerror = event => { if (voiceStatus) voiceStatus.textContent = `Voice error: ${event.error}`; };
    recognition.onend = () => { voiceInput.disabled = false; };
    try { recognition.start(); } catch { voiceInput.disabled = false; if (voiceStatus) voiceStatus.textContent = 'Could not start microphone. Check browser permissions.'; }
  });
})();
