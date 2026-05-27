/* ══════════════════════════════════════════════
   EPAI — Elite Personal AI
   script.js · Private Intelligence Suite
══════════════════════════════════════════════ */

// ══════════════════════════════════════════
// ⚙️  CONFIGURATION — EDIT HERE
// ══════════════════════════════════════════
const CONFIG = {

  // 🔑 ACCESS PASSWORD — change to your private key
  PASSWORD: "epai2025",

  // 🤖 ANTHROPIC API KEY
  // Get yours at: https://console.anthropic.com/
  // Format: "sk-ant-api03-..."
  API_KEY: "YOUR_ANTHROPIC_API_KEY_HERE",

  // 🧠 AI MODEL
  // Options:
  //   "claude-sonnet-4-20250514"   ← recommended (smart + fast)
  //   "claude-haiku-4-5-20251001"  ← faster, cheaper
  MODEL: "claude-sonnet-4-20250514",

  // 🎭 SYSTEM PROMPT — defines EPAI's personality
  SYSTEM_PROMPT: `You are EPAI (Elite Personal AI), a highly intelligent, sophisticated private AI assistant. 
You are exclusive, sharp, and speak with quiet confidence. You are direct and insightful.
Format your responses with proper markdown when useful: **bold**, *italic*, bullet lists, code blocks.
You are a private tool, not a public service. Treat the user as an elite, intelligent individual.`,

  // ⏱️ Dramatic loading delay (ms) — set to 0 to disable
  DRAMA_DELAY: 600,
};

// ══════════════════════════════════════════
// 🔐 LOCK SCREEN
// ══════════════════════════════════════════

// Canvas particle effect on lock screen
(function initLockCanvas() {
  const canvas = document.getElementById("lockCanvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  let W, H, particles = [];

  function resize() {
    W = canvas.width = window.innerWidth;
    H = canvas.height = window.innerHeight;
  }
  resize();
  window.addEventListener("resize", resize);

  for (let i = 0; i < 60; i++) {
    particles.push({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      vx: (Math.random() - 0.5) * 0.3,
      vy: (Math.random() - 0.5) * 0.3,
      r: Math.random() * 1.2 + 0.3,
      a: Math.random() * 0.4 + 0.05,
    });
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);
    particles.forEach(p => {
      p.x += p.vx; p.y += p.vy;
      if (p.x < 0) p.x = W;
      if (p.x > W) p.x = 0;
      if (p.y < 0) p.y = H;
      if (p.y > H) p.y = 0;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(212,175,55,${p.a})`;
      ctx.fill();
    });
    requestAnimationFrame(draw);
  }
  draw();
})();

document.getElementById("passInput").addEventListener("keydown", e => {
  if (e.key === "Enter") checkPass();
});

function checkPass() {
  const val = document.getElementById("passInput").value;
  const msg = document.getElementById("lockMsg");

  if (val === CONFIG.PASSWORD) {
    msg.textContent = "Credentials accepted.";
    msg.className = "lock-msg ok";
    playTone([440, 554, 659, 880], [0, .2, .4, .65]);
    setTimeout(startAccessSequence, 400);
  } else {
    msg.textContent = "⬡  Access denied — invalid key";
    msg.className = "lock-msg err";
    document.getElementById("passInput").value = "";
    shake(document.getElementById("lockCard"));
  }
}

function shake(el) {
  el.style.animation = "none";
  void el.offsetHeight;
  el.style.animation = "shake .4s ease";
  if (!document.getElementById("_shakeKF")) {
    const s = document.createElement("style");
    s.id = "_shakeKF";
    s.textContent = `@keyframes shake{0%,100%{transform:translateX(0)}20%{transform:translateX(-10px)}40%{transform:translateX(10px)}60%{transform:translateX(-6px)}80%{transform:translateX(6px)}}`;
    document.head.appendChild(s);
  }
}

// ══════════════════════════════════════════
// 🎬 ACCESS GRANTED SEQUENCE
// ══════════════════════════════════════════
function startAccessSequence() {
  const lockScreen = document.getElementById("lockScreen");
  const overlay = document.getElementById("accessOverlay");

  lockScreen.style.transition = "opacity .5s";
  lockScreen.style.opacity = "0";
  setTimeout(() => lockScreen.classList.add("hidden"), 500);

  overlay.classList.remove("hidden");

  const lines = [["aol1", 200], ["aol2", 800], ["aol3", 1400]];
  lines.forEach(([id, delay]) => {
    setTimeout(() => document.getElementById(id).classList.add("show"), delay);
  });

  setTimeout(() => {
    document.getElementById("aoGranted").classList.remove("hidden");
    requestAnimationFrame(() => document.getElementById("aoGranted").classList.add("show"));
    playTone([523, 659, 784, 1047], [0, .15, .3, .5]);
  }, 2100);

  setTimeout(() => {
    document.getElementById("aoReady").classList.remove("hidden");
    requestAnimationFrame(() => document.getElementById("aoReady").classList.add("show"));
  }, 2700);

  setTimeout(() => {
    overlay.style.transition = "opacity .6s";
    overlay.style.opacity = "0";
    setTimeout(() => {
      overlay.classList.add("hidden");
      document.getElementById("mainApp").classList.remove("hidden");
      loadChatHistory();
      if (Object.keys(chatSessions).length === 0) newChat();
      else loadSession(currentSessionId || Object.keys(chatSessions)[0]);
    }, 600);
  }, 3500);
}

// ══════════════════════════════════════════
// 🔔 AUDIO ENGINE
// ══════════════════════════════════════════
function playTone(freqs, delays, vol = 0.06) {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    freqs.forEach((f, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain); gain.connect(ctx.destination);
      osc.type = "sine"; osc.frequency.value = f;
      const t = ctx.currentTime + (delays[i] || 0);
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(vol, t + .05);
      gain.gain.exponentialRampToValueAtTime(.0001, t + .35);
      osc.start(t); osc.stop(t + .4);
    });
  } catch (e) {}
}

// ══════════════════════════════════════════
// 💾 SESSION / LOCALSTORAGE
// ══════════════════════════════════════════
let chatSessions = {};    // { id: { title, messages: [] } }
let currentSessionId = null;
let pendingAttachments = [];  // { type, name, data, dataUrl }

const LS_KEY = "epai_sessions";
const LS_CUR = "epai_current";

function saveSessions() {
  try { localStorage.setItem(LS_KEY, JSON.stringify(chatSessions)); } catch (e) {}
}

function loadChatHistory() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (raw) chatSessions = JSON.parse(raw);
    currentSessionId = localStorage.getItem(LS_CUR) || null;
  } catch (e) { chatSessions = {}; }
  renderSidebarHistory();
}

function renderSidebarHistory() {
  const el = document.getElementById("chatHistory");
  el.innerHTML = "";
  const ids = Object.keys(chatSessions).reverse();
  ids.forEach(id => {
    const s = chatSessions[id];
    const item = document.createElement("div");
    item.className = "history-item" + (id === currentSessionId ? " active" : "");
    item.innerHTML = `
      <span class="hi-icon">◈</span>
      <span class="hi-title">${escHtml(s.title || "Untitled")}</span>
      <button class="hi-del" onclick="deleteSession('${id}', event)" title="Delete">✕</button>
    `;
    item.addEventListener("click", () => loadSession(id));
    el.appendChild(item);
  });
  document.getElementById("msgCount").textContent =
    currentSessionId && chatSessions[currentSessionId]
      ? chatSessions[currentSessionId].messages.length : 0;
}

function newChat() {
  const id = "s_" + Date.now();
  chatSessions[id] = { title: "New Conversation", messages: [] };
  currentSessionId = id;
  localStorage.setItem(LS_CUR, id);
  saveSessions();
  renderSidebarHistory();
  renderMessages([]);
  document.getElementById("currentChatTitle").textContent = "New Conversation";
  document.getElementById("welcomeScreen").style.display = "flex";
  document.getElementById("messagesList").innerHTML = "";
  document.getElementById("typingIndicator").classList.add("hidden");
  pendingAttachments = [];
  document.getElementById("attachmentPreviews").innerHTML = "";
}

function loadSession(id) {
  if (!chatSessions[id]) return;
  currentSessionId = id;
  localStorage.setItem(LS_CUR, id);
  renderSidebarHistory();
  renderMessages(chatSessions[id].messages);
  document.getElementById("currentChatTitle").textContent = chatSessions[id].title;
  scrollToBottom();
}

function deleteSession(id, e) {
  e.stopPropagation();
  delete chatSessions[id];
  saveSessions();
  if (currentSessionId === id) {
    const remaining = Object.keys(chatSessions);
    if (remaining.length > 0) loadSession(remaining[remaining.length - 1]);
    else newChat();
  } else {
    renderSidebarHistory();
  }
}

function deleteCurrentChat() {
  if (currentSessionId) deleteSession(currentSessionId, { stopPropagation: () => {} });
}

// ══════════════════════════════════════════
// 💬 RENDER MESSAGES
// ══════════════════════════════════════════
function renderMessages(messages) {
  const list = document.getElementById("messagesList");
  const welcome = document.getElementById("welcomeScreen");
  list.innerHTML = "";

  if (messages.length === 0) {
    welcome.style.display = "flex";
    return;
  }
  welcome.style.display = "none";

  messages.forEach(m => appendMessageDOM(m, false));
  document.getElementById("msgCount").textContent = messages.length;
}

function appendMessageDOM(msg, animate = true) {
  const list = document.getElementById("messagesList");
  document.getElementById("welcomeScreen").style.display = "none";

  const group = document.createElement("div");
  group.className = `msg-group ${msg.role}`;
  if (!animate) group.style.animation = "none";

  const avatarLabel = msg.role === "ai" ? "E" : "U";
  const time = msg.time || formatTime(new Date());

  // Build attachment HTML
  let attachHtml = "";
  if (msg.attachment) {
    const a = msg.attachment;
    if (a.type === "image") {
      attachHtml = `<img class="bubble-image" src="${a.dataUrl}" alt="${escHtml(a.name)}"/>`;
    } else {
      attachHtml = `<div class="bubble-file"><span class="bubble-file-icon">${fileIcon(a.name)}</span><span>${escHtml(a.name)}</span></div>`;
    }
  }

  const copyId = "msg_" + Date.now() + Math.random().toString(36).slice(2);

  group.innerHTML = `
    <div class="msg-avatar">${avatarLabel}</div>
    <div class="msg-body">
      <div class="msg-meta">
        <span>${msg.role === "ai" ? "EPAI" : "You"}</span>
        <span>${time}</span>
      </div>
      <div class="msg-bubble" id="${copyId}">
        ${attachHtml}
        ${msg.role === "ai" ? renderMarkdown(msg.content) : `<p>${escHtml(msg.content)}</p>`}
      </div>
      <div class="msg-actions">
        <button class="msg-action-btn" onclick="copyMsg('${copyId}', this)">⎘ Copy</button>
        ${msg.role === "ai" ? `<button class="msg-action-btn" onclick="regenerate()">↺ Retry</button>` : ""}
      </div>
    </div>
  `;
  list.appendChild(group);
}

// ══════════════════════════════════════════
// ✉️  SEND MESSAGE
// ══════════════════════════════════════════
async function sendMessage() {
  const input = document.getElementById("messageInput");
  const text = input.value.trim();
  if (!text && pendingAttachments.length === 0) return;

  const session = chatSessions[currentSessionId];
  if (!session) return;

  // Build user message
  const userMsg = {
    role: "user",
    content: text || (pendingAttachments[0]?.name || ""),
    time: formatTime(new Date()),
    attachment: pendingAttachments.length > 0 ? { ...pendingAttachments[0] } : null,
  };

  session.messages.push(userMsg);
  session.title = session.messages.length === 1
    ? (text.slice(0, 40) || "File attachment") + (text.length > 40 ? "…" : "")
    : session.title;

  appendMessageDOM(userMsg);
  saveSessions();
  renderSidebarHistory();

  // Clear input
  input.value = "";
  autoResize(input);
  clearAttachments();
  scrollToBottom();

  // Show typing
  const typingEl = document.getElementById("typingIndicator");
  typingEl.classList.remove("hidden");
  scrollToBottom();

  // Disable send
  const sendBtn = document.getElementById("sendBtn");
  sendBtn.disabled = true;

  document.getElementById("msgCount").textContent = session.messages.length;

  try {
    await new Promise(r => setTimeout(r, CONFIG.DRAMA_DELAY));

    // ── API CALL ──────────────────────────────────────────────────────────
    // Uses Anthropic Messages API.
    // To switch to OpenAI, replace the endpoint + headers + body format.
    //
    // OpenAI alternative:
    //   URL:  https://api.openai.com/v1/chat/completions
    //   Header: Authorization: Bearer YOUR_OPENAI_KEY
    //   Body:   { model: "gpt-4o", messages: [{role, content}...] }
    // ─────────────────────────────────────────────────────────────────────

    // Build messages array for API
    const apiMessages = buildApiMessages(session.messages, userMsg);

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": CONFIG.API_KEY,
        "anthropic-version": "2023-06-01",
        "anthropic-dangerous-direct-browser-access": "true",
      },
      body: JSON.stringify({
        model: CONFIG.MODEL,
        max_tokens: 2048,
        system: CONFIG.SYSTEM_PROMPT,
        messages: apiMessages,
      }),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error?.message || `HTTP ${response.status}`);
    }

    const data = await response.json();
    const aiText = data.content.map(b => b.text || "").join("").trim();

    typingEl.classList.add("hidden");

    const aiMsg = {
      role: "ai",
      content: aiText,
      time: formatTime(new Date()),
    };
    session.messages.push(aiMsg);
    saveSessions();
    appendMessageDOM(aiMsg);
    scrollToBottom();
    document.getElementById("msgCount").textContent = session.messages.length;
    playTone([440, 523], [0, .15], .04);

  } catch (err) {
    typingEl.classList.add("hidden");
    console.warn("EPAI API error:", err.message);

    // Demo fallback when API key not set
    const fallback = CONFIG.API_KEY === "YOUR_ANTHROPIC_API_KEY_HERE"
      ? "⬡ **Demo Mode** — Add your Anthropic API key in `script.js` under `CONFIG.API_KEY` to enable AI responses.\n\nGet your key at [console.anthropic.com](https://console.anthropic.com)."
      : `⬡ **Connection error** — ${err.message}\n\nPlease verify your API key and try again.`;

    const errMsg = { role: "ai", content: fallback, time: formatTime(new Date()) };
    session.messages.push(errMsg);
    saveSessions();
    appendMessageDOM(errMsg);
    scrollToBottom();
  } finally {
    sendBtn.disabled = false;
  }
}

// Build the messages array for the API — handles conversation history + attachments
function buildApiMessages(messages, currentUserMsg) {
  // Send last 20 messages for context window management
  const history = messages.slice(-20);

  return history.map(m => {
    if (m.role === "user") {
      // If message has an image attachment, use vision format
      if (m.attachment && m.attachment.type === "image" && m.attachment.dataUrl) {
        const base64 = m.attachment.dataUrl.split(",")[1];
        const mimeMatch = m.attachment.dataUrl.match(/data:([^;]+);/);
        const mediaType = mimeMatch ? mimeMatch[1] : "image/jpeg";
        return {
          role: "user",
          content: [
            { type: "image", source: { type: "base64", media_type: mediaType, data: base64 } },
            { type: "text", text: m.content || "Analyze this image." },
          ],
        };
      }
      // File text extraction note
      if (m.attachment && m.attachment.type === "file" && m.attachment.textContent) {
        return {
          role: "user",
          content: `[File: ${m.attachment.name}]\n\n${m.attachment.textContent}\n\n${m.content}`.trim(),
        };
      }
      return { role: "user", content: m.content || "" };
    }
    return { role: "assistant", content: m.content || "" };
  });
}

// ══════════════════════════════════════════
// 📎 ATTACHMENTS
// ══════════════════════════════════════════
function toggleAttachMenu(e) {
  e.stopPropagation();
  const menu = document.getElementById("attachMenu");
  menu.classList.toggle("hidden");
}
document.addEventListener("click", () => {
  document.getElementById("attachMenu").classList.add("hidden");
});

function clearAttachments() {
  pendingAttachments = [];
  document.getElementById("attachmentPreviews").innerHTML = "";
}

function addAttachPreview(id, html) {
  const prev = document.getElementById("attachmentPreviews");
  const wrap = document.createElement("div");
  wrap.className = "attach-preview";
  wrap.id = `ap_${id}`;
  wrap.innerHTML = html + `<button class="ap-remove" onclick="removeAttach('${id}')">✕</button>`;
  prev.appendChild(wrap);
}

function removeAttach(id) {
  pendingAttachments = pendingAttachments.filter(a => a.id !== id);
  const el = document.getElementById(`ap_${id}`);
  if (el) el.remove();
}

// Image upload
function handleImageUpload(e) {
  const file = e.target.files[0];
  if (!file) return;
  document.getElementById("attachMenu").classList.add("hidden");
  const reader = new FileReader();
  reader.onload = ev => {
    const id = "img_" + Date.now();
    pendingAttachments.push({ id, type: "image", name: file.name, dataUrl: ev.target.result });
    addAttachPreview(id, `<img src="${ev.target.result}" alt="${escHtml(file.name)}"/>`);
  };
  reader.readAsDataURL(file);
  e.target.value = "";
}

// File upload (PDF, DOCX, TXT, etc.)
function handleFileUpload(e) {
  const file = e.target.files[0];
  if (!file) return;
  document.getElementById("attachMenu").classList.add("hidden");
  const id = "file_" + Date.now();
  const icon = fileIcon(file.name);

  // Try to read as text for TXT/CSV
  if (file.type === "text/plain" || file.name.endsWith(".txt") || file.name.endsWith(".csv")) {
    const reader = new FileReader();
    reader.onload = ev => {
      pendingAttachments.push({ id, type: "file", name: file.name, textContent: ev.target.result, dataUrl: null });
    };
    reader.readAsText(file);
  } else {
    // For PDF/DOCX/XLSX: attach name only (full extraction requires backend)
    pendingAttachments.push({ id, type: "file", name: file.name, textContent: null, dataUrl: null });
  }

  addAttachPreview(id, `
    <div class="attach-preview-file">
      <span class="ap-icon">${icon}</span>
      <span class="attach-preview-name">${escHtml(file.name)}</span>
    </div>
  `);
  e.target.value = "";
}

// Audio upload
function handleAudioUpload(e) {
  const file = e.target.files[0];
  if (!file) return;
  document.getElementById("attachMenu").classList.add("hidden");
  const id = "audio_" + Date.now();
  pendingAttachments.push({ id, type: "audio", name: file.name, dataUrl: null });
  addAttachPreview(id, `
    <div class="attach-preview-file">
      <span class="ap-icon">🎤</span>
      <span class="attach-preview-name">${escHtml(file.name)}</span>
    </div>
  `);
  e.target.value = "";
}

// Video upload (UI only — video files are too large for base64)
function handleVideoUpload(e) {
  const file = e.target.files[0];
  if (!file) return;
  document.getElementById("attachMenu").classList.add("hidden");
  const id = "video_" + Date.now();
  pendingAttachments.push({ id, type: "video", name: file.name, dataUrl: null });
  addAttachPreview(id, `
    <div class="attach-preview-file">
      <span class="ap-icon">🎥</span>
      <span class="attach-preview-name">${escHtml(file.name)}</span>
    </div>
  `);
  e.target.value = "";
}

// ══════════════════════════════════════════
// 📷 CAMERA
// ══════════════════════════════════════════
let cameraStream = null;
let capturedPhoto = null;

async function openCamera() {
  document.getElementById("attachMenu").classList.add("hidden");
  const modal = document.getElementById("cameraModal");
  modal.classList.remove("hidden");
  try {
    cameraStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" } });
    document.getElementById("cameraVideo").srcObject = cameraStream;
    document.getElementById("cameraVideo").classList.remove("hidden");
    document.getElementById("cameraPreview").classList.add("hidden");
    document.getElementById("captureBtn").classList.remove("hidden");
    document.getElementById("usePhotoBtn").classList.add("hidden");
    document.getElementById("retakeBtn").style.display = "none";
    capturedPhoto = null;
  } catch (err) {
    modal.classList.add("hidden");
    alert("Camera access denied or unavailable.");
  }
}

function capturePhoto() {
  const video = document.getElementById("cameraVideo");
  const canvas = document.getElementById("cameraCanvas");
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  canvas.getContext("2d").drawImage(video, 0, 0);
  capturedPhoto = canvas.toDataURL("image/jpeg", 0.9);

  // Stop stream, show preview
  if (cameraStream) { cameraStream.getTracks().forEach(t => t.stop()); cameraStream = null; }
  video.classList.add("hidden");
  const prev = document.getElementById("cameraPreview");
  prev.src = capturedPhoto;
  prev.classList.remove("hidden");
  document.getElementById("captureBtn").classList.add("hidden");
  document.getElementById("usePhotoBtn").classList.remove("hidden");
  document.getElementById("retakeBtn").style.display = "inline-block";
}

async function retakePhoto() {
  capturedPhoto = null;
  document.getElementById("cameraPreview").classList.add("hidden");
  document.getElementById("cameraVideo").classList.remove("hidden");
  document.getElementById("captureBtn").classList.remove("hidden");
  document.getElementById("usePhotoBtn").classList.add("hidden");
  document.getElementById("retakeBtn").style.display = "none";
  cameraStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" } }).catch(() => null);
  if (cameraStream) document.getElementById("cameraVideo").srcObject = cameraStream;
}

function useCameraPhoto() {
  if (!capturedPhoto) return;
  const id = "cam_" + Date.now();
  pendingAttachments.push({ id, type: "image", name: "camera_photo.jpg", dataUrl: capturedPhoto });
  addAttachPreview(id, `<img src="${capturedPhoto}" alt="Camera photo"/>`);
  closeCamera();
}

function closeCamera() {
  if (cameraStream) { cameraStream.getTracks().forEach(t => t.stop()); cameraStream = null; }
  document.getElementById("cameraModal").classList.add("hidden");
}

// ══════════════════════════════════════════
// 🎙️ VOICE INPUT (Web Speech API)
// ══════════════════════════════════════════
let recognition = null;
let isRecording = false;

function toggleVoice() {
  const btn = document.getElementById("voiceBtn");
  const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;

  if (!SpeechRec) {
    showToast("Speech recognition not supported in this browser.");
    return;
  }

  if (isRecording) {
    if (recognition) recognition.stop();
    return;
  }

  recognition = new SpeechRec();
  recognition.continuous = false;
  recognition.interimResults = true;
  recognition.lang = "en-US"; // Change to "id-ID" for Bahasa Indonesia

  recognition.onstart = () => {
    isRecording = true;
    btn.classList.add("recording");
  };
  recognition.onresult = e => {
    const transcript = Array.from(e.results).map(r => r[0].transcript).join("");
    document.getElementById("messageInput").value = transcript;
    autoResize(document.getElementById("messageInput"));
  };
  recognition.onend = () => {
    isRecording = false;
    btn.classList.remove("recording");
    recognition = null;
  };
  recognition.onerror = () => {
    isRecording = false;
    btn.classList.remove("recording");
    recognition = null;
  };
  recognition.start();
}

// ══════════════════════════════════════════
// 🔁 UTILITY
// ══════════════════════════════════════════
function handleKeydown(e) {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    sendMessage();
  }
}

function autoResize(el) {
  el.style.height = "auto";
  el.style.height = Math.min(el.scrollHeight, 160) + "px";
}

function scrollToBottom() {
  const wrap = document.getElementById("messagesWrap");
  setTimeout(() => { wrap.scrollTop = wrap.scrollHeight; }, 50);
}

function setPrompt(text) {
  const input = document.getElementById("messageInput");
  input.value = text + " ";
  input.focus();
  autoResize(input);
}

function formatTime(d) {
  return d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false });
}

function escHtml(s) {
  return String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
}

function fileIcon(name) {
  const ext = (name || "").split(".").pop().toLowerCase();
  const map = { pdf:"📄", doc:"📝", docx:"📝", txt:"📃", xlsx:"📊", xls:"📊", csv:"📊", mp3:"🎵", wav:"🎵", m4a:"🎵", mp4:"🎬", mov:"🎬" };
  return map[ext] || "📁";
}

function copyMsg(id, btn) {
  const el = document.getElementById(id);
  const text = el ? el.innerText : "";
  navigator.clipboard.writeText(text).then(() => {
    const orig = btn.textContent;
    btn.textContent = "✓ Copied";
    btn.style.color = "#3d9970";
    setTimeout(() => { btn.textContent = orig; btn.style.color = ""; }, 1500);
  });
}

function regenerate() {
  const session = chatSessions[currentSessionId];
  if (!session || session.messages.length < 2) return;
  // Remove last AI message and resend
  if (session.messages[session.messages.length - 1].role === "ai") {
    session.messages.pop();
    const list = document.getElementById("messagesList");
    if (list.lastElementChild) list.lastElementChild.remove();
    saveSessions();
    // Trigger send (re-use last user message)
    const lastUser = [...session.messages].reverse().find(m => m.role === "user");
    if (lastUser) {
      document.getElementById("messageInput").value = lastUser.content;
      sendMessage();
    }
  }
}

function exportChat() {
  const session = chatSessions[currentSessionId];
  if (!session) return;
  let text = `EPAI — ${session.title}\nExported: ${new Date().toLocaleString()}\n${"─".repeat(50)}\n\n`;
  session.messages.forEach(m => {
    text += `[${m.time}] ${m.role === "ai" ? "EPAI" : "You"}:\n${m.content}\n\n`;
  });
  const blob = new Blob([text], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a"); a.href = url;
  a.download = `epai-chat-${Date.now()}.txt`; a.click();
  URL.revokeObjectURL(url);
}

// ══════════════════════════════════════════
// 📝 MARKDOWN RENDERER (lightweight)
// ══════════════════════════════════════════
function renderMarkdown(text) {
  if (!text) return "";
  let h = escHtml(text);

  // Code blocks
  h = h.replace(/```(\w*)\n?([\s\S]*?)```/g, (_, lang, code) =>
    `<pre><code class="lang-${lang}">${code.trim()}</code></pre>`);
  // Inline code
  h = h.replace(/`([^`]+)`/g, "<code>$1</code>");
  // Bold
  h = h.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
  // Italic
  h = h.replace(/\*(.+?)\*/g, "<em>$1</em>");
  // Headers
  h = h.replace(/^### (.+)$/gm, "<h4>$1</h4>");
  h = h.replace(/^## (.+)$/gm, "<h3>$1</h3>");
  h = h.replace(/^# (.+)$/gm, "<h2>$1</h2>");
  // Unordered lists
  h = h.replace(/^\s*[-*] (.+)$/gm, "<li>$1</li>");
  h = h.replace(/(<li>[\s\S]+?<\/li>)/g, "<ul>$1</ul>");
  // Numbered lists
  h = h.replace(/^\d+\. (.+)$/gm, "<li>$1</li>");
  // Horizontal rule
  h = h.replace(/^─{3,}$/gm, "<hr/>");
  // Paragraphs (double newlines)
  h = h.split(/\n\n+/).map(p => {
    p = p.trim();
    if (!p) return "";
    if (/^<(h[1-6]|ul|ol|pre|hr)/.test(p)) return p;
    return `<p>${p.replace(/\n/g, "<br/>")}</p>`;
  }).join("");

  return h;
}

// ══════════════════════════════════════════
// 🔒 LOCK APP
// ══════════════════════════════════════════
function lockApp() {
  document.getElementById("mainApp").classList.add("hidden");
  const lock = document.getElementById("lockScreen");
  lock.classList.remove("hidden");
  lock.style.opacity = "0";
  requestAnimationFrame(() => {
    lock.style.transition = "opacity .5s";
    lock.style.opacity = "1";
  });
  document.getElementById("passInput").value = "";
  document.getElementById("lockMsg").textContent = "";
  document.getElementById("lockMsg").className = "lock-msg";
  // Reset access overlay
  const ov = document.getElementById("accessOverlay");
  ov.classList.add("hidden"); ov.style.opacity = "1";
  ["aol1","aol2","aol3"].forEach(id => document.getElementById(id).classList.remove("show"));
  const ag = document.getElementById("aoGranted");
  ag.classList.add("hidden"); ag.classList.remove("show");
  const ar = document.getElementById("aoReady");
  ar.classList.add("hidden"); ar.classList.remove("show");
}

// ══════════════════════════════════════════
// 📱 SIDEBAR TOGGLE (mobile)
// ══════════════════════════════════════════
function toggleSidebar() {
  document.getElementById("sidebar").classList.toggle("open");
}

// ══════════════════════════════════════════
// 🍞 TOAST
// ══════════════════════════════════════════
function showToast(msg) {
  const t = document.createElement("div");
  t.style.cssText = `position:fixed;bottom:24px;right:24px;background:#141418;border:1px solid rgba(212,175,55,.2);border-radius:10px;padding:12px 18px;font-size:12px;letter-spacing:1px;color:rgba(212,175,55,.8);z-index:9999;animation:fadeIn .25s ease both;`;
  t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 3000);
}
