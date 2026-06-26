(function () {
  var BOT_NAME = 'JYS메이트';
  var WELCOME_TEXT = '안녕하세요! 저는 JYS마케팅 상담봇 JYS메이트예요 🙂\nSNS 광고, 가격, 프로세스 등 무엇이든 물어보세요!';
  var MAX_HISTORY = 10;

  var history = [];
  var isOpen = false;
  var isLoading = false;
  var els = {};

  function getAccentColor() {
    var el = document.querySelector('[data-screen-label="JYS마케팅 랜딩 페이지"]');
    if (el) {
      var v = getComputedStyle(el).getPropertyValue('--accent');
      if (v && v.trim()) return v.trim();
    }
    return '#3E6AE1';
  }

  function injectStyles(accent) {
    var style = document.createElement('style');
    style.id = 'jys-chatbot-styles';
    style.textContent =
      '#jys-chatbot-root *{box-sizing:border-box;font-family:\'Pretendard\',-apple-system,\'Apple SD Gothic Neo\',sans-serif;}' +
      '#jys-chatbot-root{position:fixed;right:20px;bottom:20px;z-index:9999;}' +
      '#jys-chat-launcher{width:58px;height:58px;border-radius:50%;background:' + accent + ';border:none;cursor:pointer;box-shadow:0 8px 24px rgba(0,0,0,.22);display:flex;align-items:center;justify-content:center;transition:transform .25s ease;}' +
      '#jys-chat-launcher:hover{transform:scale(1.06);}' +
      '#jys-chat-launcher svg{width:26px;height:26px;}' +
      '#jys-welcome-bubble{position:absolute;right:70px;bottom:8px;max-width:240px;background:#ffffff;color:#171A20;font-size:13.5px;line-height:1.55;padding:14px 16px;border-radius:14px;box-shadow:0 8px 24px rgba(0,0,0,.18);opacity:0;transform:translateY(8px);transition:opacity .35s ease,transform .35s ease;white-space:pre-line;}' +
      '#jys-welcome-bubble.show{opacity:1;transform:translateY(0);}' +
      '#jys-welcome-bubble .jys-close{position:absolute;top:4px;right:6px;cursor:pointer;color:#B0B0B0;font-size:13px;border:none;background:none;}' +
      '#jys-chat-panel{position:absolute;right:0;bottom:74px;width:360px;max-width:calc(100vw - 40px);height:520px;max-height:calc(100vh - 120px);background:#ffffff;border-radius:16px;box-shadow:0 16px 48px rgba(0,0,0,.24);display:flex;flex-direction:column;overflow:hidden;opacity:0;transform:translateY(16px) scale(.98);pointer-events:none;transition:opacity .28s ease,transform .28s ease;}' +
      '#jys-chat-panel.open{opacity:1;transform:translateY(0) scale(1);pointer-events:auto;}' +
      '#jys-chat-header{background:' + accent + ';color:#fff;padding:16px 18px;display:flex;align-items:center;justify-content:space-between;flex-shrink:0;}' +
      '#jys-chat-header .jys-title{font-size:15px;font-weight:600;}' +
      '#jys-chat-header .jys-sub{font-size:12px;opacity:.82;margin-top:2px;}' +
      '#jys-chat-close{background:none;border:none;color:#fff;font-size:18px;cursor:pointer;opacity:.85;line-height:1;}' +
      '#jys-chat-body{flex:1;overflow-y:auto;padding:16px;display:flex;flex-direction:column;gap:10px;background:#F8F8F9;}' +
      '.jys-msg{max-width:82%;padding:10px 14px;border-radius:14px;font-size:14px;line-height:1.6;white-space:pre-line;word-break:break-word;}' +
      '.jys-msg.user{align-self:flex-end;background:' + accent + ';color:#fff;border-bottom-right-radius:4px;}' +
      '.jys-msg.bot{align-self:flex-start;background:#ffffff;color:#171A20;border:1px solid #ECECEE;border-bottom-left-radius:4px;}' +
      '.jys-msg.error{background:#FDECEA;color:#C2410C;border:1px solid #F5C6BB;}' +
      '.jys-typing{align-self:flex-start;display:flex;gap:4px;padding:12px 16px;background:#ffffff;border:1px solid #ECECEE;border-radius:14px;border-bottom-left-radius:4px;}' +
      '.jys-typing span{width:6px;height:6px;border-radius:50%;background:#B0B0B0;animation:jys-bounce 1.2s infinite ease-in-out;}' +
      '.jys-typing span:nth-child(2){animation-delay:.15s;}' +
      '.jys-typing span:nth-child(3){animation-delay:.3s;}' +
      '@keyframes jys-bounce{0%,80%,100%{transform:translateY(0);opacity:.5;}40%{transform:translateY(-5px);opacity:1;}}' +
      '#jys-chat-footer{display:flex;gap:8px;padding:12px;border-top:1px solid #EEEEEE;flex-shrink:0;background:#ffffff;}' +
      '#jys-chat-input{flex:1;border:1px solid #D0D1D2;border-radius:20px;padding:10px 16px;font-size:14px;outline:none;resize:none;line-height:1.4;max-height:80px;}' +
      '#jys-chat-input:focus{border-color:' + accent + ';}' +
      '#jys-chat-send{width:40px;height:40px;border-radius:50%;border:none;background:' + accent + ';color:#fff;cursor:pointer;display:flex;align-items:center;justify-content:center;flex-shrink:0;transition:opacity .2s ease;}' +
      '#jys-chat-send:disabled{opacity:.5;cursor:default;}' +
      '@media (max-width:480px){#jys-chat-panel{width:calc(100vw - 40px);height:min(520px,calc(100vh - 120px));}#jys-welcome-bubble{max-width:calc(100vw - 120px);}}';
    document.head.appendChild(style);
  }

  function svgChatIcon() {
    return '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M4 12a8 8 0 1 1 3.2 6.4L4 19l.9-3.1A8 8 0 0 1 4 12Z" stroke="#fff" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  }

  function buildWidget(accent) {
    var root = document.createElement('div');
    root.id = 'jys-chatbot-root';

    root.innerHTML =
      '<div id="jys-welcome-bubble"><button class="jys-close" aria-label="닫기">✕</button><span id="jys-welcome-text"></span></div>' +
      '<div id="jys-chat-panel" role="dialog" aria-label="JYS마케팅 챗봇">' +
        '<div id="jys-chat-header">' +
          '<div><div class="jys-title">' + BOT_NAME + '</div><div class="jys-sub">JYS마케팅 상담 챗봇</div></div>' +
          '<button id="jys-chat-close" aria-label="닫기">✕</button>' +
        '</div>' +
        '<div id="jys-chat-body"></div>' +
        '<div id="jys-chat-footer">' +
          '<textarea id="jys-chat-input" rows="1" placeholder="무엇이 궁금하신가요?"></textarea>' +
          '<button id="jys-chat-send" aria-label="전송"><svg viewBox="0 0 24 24" width="18" height="18" fill="none"><path d="M3 11.5 20 4l-7 17-2.5-7L3 11.5Z" stroke="#fff" stroke-width="1.6" stroke-linejoin="round" stroke-linecap="round"/></svg></button>' +
        '</div>' +
      '</div>' +
      '<button id="jys-chat-launcher" aria-label="채팅 열기">' + svgChatIcon() + '</button>';

    document.body.appendChild(root);

    els.root = root;
    els.bubble = root.querySelector('#jys-welcome-bubble');
    els.bubbleText = root.querySelector('#jys-welcome-text');
    els.bubbleClose = root.querySelector('.jys-close');
    els.panel = root.querySelector('#jys-chat-panel');
    els.body = root.querySelector('#jys-chat-body');
    els.input = root.querySelector('#jys-chat-input');
    els.send = root.querySelector('#jys-chat-send');
    els.launcher = root.querySelector('#jys-chat-launcher');
    els.closeBtn = root.querySelector('#jys-chat-close');

    els.launcher.addEventListener('click', function () {
      hideWelcomeBubble();
      toggleChat();
    });
    els.closeBtn.addEventListener('click', function () { toggleChat(false); });
    els.bubbleClose.addEventListener('click', function (e) {
      e.stopPropagation();
      hideWelcomeBubble();
    });
    els.bubble.addEventListener('click', function () {
      hideWelcomeBubble();
      toggleChat(true);
    });
    els.send.addEventListener('click', handleSend);
    els.input.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    });
  }

  function toggleChat(force) {
    isOpen = typeof force === 'boolean' ? force : !isOpen;
    els.panel.classList.toggle('open', isOpen);
    if (isOpen) {
      if (!els.body.childNodes.length) {
        appendMessage('bot', WELCOME_TEXT);
      }
      setTimeout(function () { els.input.focus(); }, 150);
    }
  }

  function appendMessage(role, text, isError) {
    var div = document.createElement('div');
    div.className = 'jys-msg ' + (role === 'user' ? 'user' : 'bot') + (isError ? ' error' : '');
    div.textContent = text;
    els.body.appendChild(div);
    els.body.scrollTop = els.body.scrollHeight;
    return div;
  }

  function showTyping() {
    var div = document.createElement('div');
    div.className = 'jys-typing';
    div.id = 'jys-typing-indicator';
    div.innerHTML = '<span></span><span></span><span></span>';
    els.body.appendChild(div);
    els.body.scrollTop = els.body.scrollHeight;
  }

  function removeTyping() {
    var el = document.getElementById('jys-typing-indicator');
    if (el) el.remove();
  }

  function setLoading(loading) {
    isLoading = loading;
    els.send.disabled = loading;
    els.input.disabled = loading;
  }

  function handleSend() {
    var text = els.input.value.trim();
    if (!text || isLoading) return;
    els.input.value = '';
    sendMessage(text);
  }

  function sendMessage(text) {
    history.push({ role: 'user', content: text });
    history = history.slice(-MAX_HISTORY);
    appendMessage('user', text);
    showTyping();
    setLoading(true);

    fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: history })
    })
      .then(function (res) {
        return res.json().then(function (data) { return { ok: res.ok, data: data }; });
      })
      .then(function (result) {
        removeTyping();
        if (!result.ok) {
          throw new Error((result.data && result.data.error) || '오류가 발생했어요.');
        }
        var reply = result.data.reply;
        history.push({ role: 'assistant', content: reply });
        history = history.slice(-MAX_HISTORY);
        appendMessage('bot', reply);
      })
      .catch(function (err) {
        removeTyping();
        appendMessage('bot', err.message || '챗봇 응답 중 오류가 발생했어요. 잠시 후 다시 시도해 주세요.', true);
      })
      .finally(function () {
        setLoading(false);
      });
  }

  function showWelcomeBubble() {
    if (isOpen) return;
    els.bubbleText.textContent = WELCOME_TEXT;
    els.bubble.classList.add('show');
    setTimeout(hideWelcomeBubble, 8000);
  }

  function hideWelcomeBubble() {
    els.bubble.classList.remove('show');
  }

  function init() {
    var accent = getAccentColor();
    injectStyles(accent);
    buildWidget(accent);
    setTimeout(showWelcomeBubble, 1000);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
