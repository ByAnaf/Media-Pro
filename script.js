/* ==========================================================
   Media Pro — Transfer Console
   UI logic only. The actual fetch/extract call is a placeholder —
   see handleDownload() below for where to wire your own backend.
   ========================================================== */

const urlInput      = document.getElementById('urlInput');
const dropzone       = document.getElementById('dropzone');
const pasteBtn       = document.getElementById('pasteBtn');
const clearBtn       = document.getElementById('clearBtn');
const mainBtn        = document.getElementById('mainBtn');
const logEl          = document.getElementById('log');
const formatGroup    = document.getElementById('formatGroup');
const qualityGroup   = document.getElementById('qualityGroup');
const historySection = document.getElementById('historySection');
const historyList    = document.getElementById('historyList');
const clearHistoryBtn = document.getElementById('clearHistoryBtn');

const state = {
  format: 'video',
  quality: '1080',
};

const HISTORY_KEY = 'mediaPro.history';

/* ---------- segmented controls ---------- */
function wireSegmented(group, stateKey) {
  group.addEventListener('click', (e) => {
    const btn = e.target.closest('.seg');
    if (!btn) return;
    [...group.children].forEach(c => c.classList.remove('active'));
    btn.classList.add('active');
    state[stateKey] = btn.dataset.value;
  });
}
wireSegmented(formatGroup, 'format');
wireSegmented(qualityGroup, 'quality');

/* ---------- paste / clear ---------- */
pasteBtn.addEventListener('click', async () => {
  try {
    const text = await navigator.clipboard.readText();
    if (text) {
      urlInput.value = text.trim();
      urlInput.focus();
    }
  } catch {
    logLine('Clipboard access was blocked by the browser.', 'error');
  }
});

clearBtn.addEventListener('click', () => {
  urlInput.value = '';
  urlInput.focus();
});

/* ---------- drag & drop ---------- */
['dragenter', 'dragover'].forEach(evt =>
  dropzone.addEventListener(evt, (e) => {
    e.preventDefault();
    dropzone.classList.add('is-dragover');
  })
);

['dragleave', 'drop'].forEach(evt =>
  dropzone.addEventListener(evt, (e) => {
    e.preventDefault();
    dropzone.classList.remove('is-dragover');
  })
);

dropzone.addEventListener('drop', (e) => {
  const text = e.dataTransfer.getData('text/plain');
  if (text) urlInput.value = text.trim();
});

/* ---------- enter to submit ---------- */
urlInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') handleDownload();
});

/* ---------- status log ---------- */
function logLine(message, kind = 'info') {
  const line = document.createElement('div');
  line.className = `log__line log__line--${kind === 'error' ? 'error' : kind === 'ok' ? 'ok' : ''}`.trim();

  const time = document.createElement('span');
  time.className = 'log__time';
  time.textContent = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

  const msg = document.createElement('span');
  msg.textContent = message;

  line.append(time, msg);
  logEl.prepend(line);

  // keep the log from growing forever
  while (logEl.children.length > 6) logEl.removeChild(logEl.lastChild);
}

/* ---------- history ---------- */
function loadHistory() {
  try {
    return JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]');
  } catch {
    return [];
  }
}

function saveHistory(items) {
  localStorage.setItem(HISTORY_KEY, JSON.stringify(items.slice(0, 8)));
}

function renderHistory() {
  const items = loadHistory();
  historySection.hidden = items.length === 0;
  historyList.innerHTML = '';
  items.forEach((item, idx) => {
    const li = document.createElement('li');
    li.className = 'history__item';

    const span = document.createElement('span');
    span.textContent = item;
    span.title = item;

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.textContent = 'Use';
    btn.addEventListener('click', () => {
      urlInput.value = item;
      urlInput.focus();
    });

    li.append(span, btn);
    historyList.appendChild(li);
  });
}

function pushHistory(url) {
  const items = loadHistory().filter(u => u !== url);
  items.unshift(url);
  saveHistory(items);
  renderHistory();
}

clearHistoryBtn.addEventListener('click', () => {
  localStorage.removeItem(HISTORY_KEY);
  renderHistory();
});

renderHistory();

/* ---------- validation ---------- */
function isValidUrl(value) {
  try {
    const u = new URL(value);
    return u.protocol === 'http:' || u.protocol === 'https:';
  } catch {
    return false;
  }
}

/* ---------- main action ---------- */
async function handleDownload() {
  const url = urlInput.value.trim();

  if (!url) {
    logLine('Paste a link first.', 'error');
    urlInput.focus();
    return;
  }
  if (!isValidUrl(url)) {
    logLine('That doesn\u2019t look like a valid URL.', 'error');
    return;
  }

  mainBtn.disabled = true;
  mainBtn.classList.add('is-loading');
  logLine(`Requesting ${state.format} · ${state.quality} …`);

  try {
    const result = await requestMedia(url, state.format, state.quality);

    if (result?.fileUrl) {
      logLine('Stream ready. Starting save…', 'ok');
      triggerBrowserSave(result.fileUrl, result.filename || 'download');
      logLine('Saved to your device.', 'ok');
      pushHistory(url);
    } else {
      logLine('No file returned for this link.', 'error');
    }
  } catch (err) {
    logLine(err.message || 'Something went wrong.', 'error');
  } finally {
    mainBtn.disabled = false;
    mainBtn.classList.remove('is-loading');
  }
}

/**
 * requestMedia() — PLACEHOLDER.
 *
 * This is where your own backend call belongs. It should:
 *  1. Accept a URL you have the rights to process (e.g. your own
 *     uploaded content, or a source with an official public API).
 *  2. Return { fileUrl, filename } pointing at a file your server
 *     is authorized to serve.
 *
 * This function intentionally does NOT call any third-party
 * extraction/bypass service — wire it up to your own legitimate
 * source before shipping.
 */
async function requestMedia(url, format, quality) {
  throw new Error('No backend connected yet — wire requestMedia() up to your own API.');
}

function triggerBrowserSave(fileUrl, filename) {
  const a = document.createElement('a');
  a.href = fileUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
}

mainBtn.addEventListener('click', handleDownload);
