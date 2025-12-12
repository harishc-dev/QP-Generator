
(() => {
  window.addEventListener('DOMContentLoaded', () => {
    const minBtn = document.getElementById('min-btn');
    const maxBtn = document.getElementById('max-btn');
    const closeBtn = document.getElementById('close-btn');
    if (minBtn && maxBtn && closeBtn && window.electronAPI && window.electronAPI.windowControl) {
      minBtn.onclick = () => window.electronAPI.windowControl('minimize');
      maxBtn.onclick = () => window.electronAPI.windowControl('maximize');
      closeBtn.onclick = () => window.electronAPI.windowControl('close');
    }
  });

  window.addEventListener('DOMContentLoaded', () => {
    $$('.screen').forEach(s => {
      if (s.id === 'home') {
        s.style.display = 'block';
      } else {
        s.style.display = 'none';
      }
    });
  });

 
  let questionsData = {}; 
  let selection = {}; 
  let generatedPaper = [];
  const WEIGHT_BOOST_FACTOR = 2; 
  const TARGET_BOOSTED_PROB = 0.69; 

  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => Array.from(document.querySelectorAll(sel));

  function normalizeText(s) {
    if (s == null) return '';
    const tmp = document.createElement('div');
    tmp.innerHTML = String(s);
    const text = tmp.textContent || tmp.innerText || '';
    return text.replace(/\s+/g, ' ').trim();
  }

  function saveGeneratedPaperToLocal() {
    try {
      localStorage.setItem('generatedPaper', JSON.stringify(generatedPaper || []));
    } catch (e) {
      console.warn('saveGeneratedPaper failed', e);
    }
  }
  function loadSavedGeneratedPaper() {
    try {
      const raw = localStorage.getItem('generatedPaper');
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) generatedPaper = parsed;
    } catch (e) {
      console.warn('loadSavedGeneratedPaper failed', e);
    }
  }
  function loadSavedQuestions() {
    const saved = localStorage.getItem('questionsData');
    if (!saved) return;
    try {
      questionsData = JSON.parse(saved);
    } catch (e) {
      questionsData = {};
    }
  }
  function saveQuestionsToLocal() {
    localStorage.setItem('questionsData', JSON.stringify(questionsData));
  }

  function setActiveNav(target) {
    $$('.nav-btn').forEach((b) => b.classList.toggle('active', b.dataset.target === target));
    $$('.screen').forEach((s) => {
      if (s.id === target) {
        s.style.display = 'block';
        s.classList.add('fade-in');
        setTimeout(() => s.classList.remove('fade-in'), 500);
      } else {
        s.style.display = 'none';
        s.classList.remove('fade-in');
      }
    });
    if (target === 'generate') renderGenerateScreen();
    if (target === 'upload') renderUploadScreen();
    if (target === 'view') renderGeneratedList();
  }
  $$('.nav-btn').forEach((b) => b.addEventListener('click', () => setActiveNav(b.dataset.target)));
  $('#goto-upload').addEventListener('click', () => setActiveNav('upload'));
  $('#goto-generate').addEventListener('click', () => setActiveNav('generate'));

  function renderUploadScreen() {
    renderUploadedFiles();
  }

  const dropArea = document.getElementById('drop-area');
  const fileInput = document.getElementById('file-input');

  dropArea.addEventListener('click', () => fileInput.click());
  dropArea.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropArea.classList.add('dragover');
  });
  dropArea.addEventListener('dragleave', () => dropArea.classList.remove('dragover'));
  dropArea.addEventListener('drop', async (e) => {
    e.preventDefault();
    dropArea.classList.remove('dragover');
    const files = Array.from(e.dataTransfer.files || []);
    await handleFilesUpload(files);
  });

  fileInput.addEventListener('change', async (e) => {
    const files = Array.from(e.target.files || []);
    await handleFilesUpload(files);
    fileInput.value = '';
  });

  async function handleFilesUpload(files) {
    const docxFiles = files.filter((f) => /\.docx$/i.test(f.name));
    if (docxFiles.length === 0) return alert('Please select .docx files only.');
    const fileObjs = docxFiles.map((f) => ({ path: f.path, name: f.name }));
    try {
      await window.electronAPI.uploadQuestionFiles(fileObjs);
      await renderUploadedFiles();
      try {
        const parsed = await window.electronAPI.readQuestions();
        if (parsed && typeof parsed === 'object') {
          questionsData = { ...parsed };
          saveQuestionsToLocal();
        }
      } catch (err) {
        console.warn('parse after upload failed', err);
      }
      renderGenerateScreen();
      alert('Uploaded and scanned successfully.');
    } catch (err) {
      console.error(err);
      alert('Upload failed: ' + (err.message || err));
    }
  }

  async function renderUploadedFiles() {
    const container = document.getElementById('uploaded-files');
    try {
      const files = await window.electronAPI.listUploadedQuestions();
      if (!files || files.length === 0) {
        container.innerHTML = '<div class="small">No uploaded .docx files yet.</div>';
        return;
      }
      container.innerHTML =
        '<ul>' +
        files
          .map(
            (f) =>
              `<li>${f} <button data-f="${f}" class="btn small-btn del-upload">Delete</button></li>`
          )
          .join('') +
        '</ul>';
      $$('.del-upload').forEach((btn) =>
        btn.addEventListener('click', async (ev) => {
          const fname = ev.target.dataset.f;
          if (!confirm('Delete ' + fname + '?')) return;
          await window.electronAPI.deleteUploadedQuestion(fname);
          await renderUploadedFiles();
          try {
            const parsed = await window.electronAPI.readQuestions();
            questionsData = parsed || {};
            saveQuestionsToLocal();
          } catch (e) {}
        })
      );
    } catch (err) {
      container.innerHTML = `<div class="small">Error listing uploaded files.</div>`;
    }
  }

  const defaultChapters = [
    'Units and Measurements',
    'Motion in a Straight Line',
    'Motion in a Plane',
    'Laws of Motion',
    'Work, Energy and Power',
    'System of Particles and Rotational Motion',
    'Gravitation',
    'Mechanical Properties of Solids',
    'Mechanical Properties of Fluids',
    'Thermal Properties of Matter',
    'Thermodynamics',
    'Kinetic Theory',
    'Oscillations',
    'Waves',
  ];
  const qKeys = [
    { key: 'mcq', label: 'MCQ (1 mark)' },
    { key: 'assertion', label: 'Assertion And Reason (1 mark)' },
    { key: 'short', label: 'Short Answer (2 mark)' },
    { key: 'qa', label: 'Question and answer (3 mark)' },
    { key: 'long', label: 'Long answer (5 mark)' },
    { key: 'case', label: 'Case Study (4 mark)' },
  ];

  function ensureLessonStructure() {
    loadSavedQuestions();
    defaultChapters.forEach((ch) => {
      if (!questionsData[ch]) {
        questionsData[ch] = {};
      }
      qKeys.forEach((q) => {
        if (!Array.isArray(questionsData[ch][q.key])) questionsData[ch][q.key] = [];
      });
    });
  }

  function renderGenerateScreen() {
    ensureLessonStructure();
    const list = document.getElementById('lesson-list');
    list.innerHTML = '';
    defaultChapters.forEach((ch, idx) => {
      const card = document.createElement('div');
      card.className = 'lesson-card';
      const h = document.createElement('h4');
      h.textContent = `${idx + 1}. ${ch}`;
      card.appendChild(h);
      qKeys.forEach((q) => {
        const row = document.createElement('div');
        row.className = 'lesson-row';
        const left = document.createElement('div');
        const pool = questionsData[ch] && questionsData[ch][q.key] ? questionsData[ch][q.key] : [];
        const readyCount = pool.length;
        const boostedCount = pool.filter(p => (typeof p.weight === 'number' && p.weight > 1)).length;
        left.textContent = q.label + ` (${readyCount} ready${boostedCount ? ', ' + boostedCount + ' boosted' : ''})`;
        const inp = document.createElement('input');
        inp.type = 'number';
        inp.min = 0;
        inp.value = selection[ch] && selection[ch][q.key] ? selection[ch][q.key] : 0;
        inp.dataset.lesson = ch;
        inp.dataset.qkey = q.key;
        inp.addEventListener('input', () => {
          if (!selection[ch]) selection[ch] = {};
          const v = Number.parseInt(inp.value, 10);
          selection[ch][q.key] = Number.isFinite(v) && v > 0 ? v : 0;
        });
        row.appendChild(left);
        row.appendChild(inp);
        card.appendChild(row);
      });
      list.appendChild(card);
    });
  }

  function gatherSelectionFromDOM() {
    selection = {};
    const inputs = document.querySelectorAll('#lesson-list input[type="number"]');
    inputs.forEach((inp) => {
      const ch = inp.dataset.lesson;
      const key = inp.dataset.qkey;
      const v = Number.parseInt(inp.value, 10);
      if (!selection[ch]) selection[ch] = {};
      selection[ch][key] = Number.isFinite(v) && v > 0 ? v : 0;
    });
  }

  document.getElementById('generate-btn').addEventListener('click', () => {
   
    gatherSelectionFromDOM();
    generatePaperPreview();
  });

  async function generatePaperPreview() {
    generatedPaper = [];

    Object.keys(selection).forEach((ch) => {
      qKeys.forEach((q) => {
        const count = selection[ch] && selection[ch][q.key] ? selection[ch][q.key] : 0;
        if (count <= 0) return;

        const pool = (questionsData[ch] && Array.isArray(questionsData[ch][q.key]))
          ? questionsData[ch][q.key].slice()
          : [];

        if (pool.length === 0) return;

  const selected = weightedSample(pool, count, TARGET_BOOSTED_PROB);

        selected.forEach((chosen) => {
          generatedPaper.push({
            lesson: ch,
            type: q.label,
            question: chosen.question,
            answer: chosen.answer,
            boosted: typeof chosen.weight === 'number' && chosen.weight > 1,
            weight: typeof chosen.weight === 'number' ? chosen.weight : 1,
          });
        });
      });
    });

    saveGeneratedPaperToLocal();
    renderPaperPreview();
  }

  function weightedSample(pool, count, targetProb = TARGET_BOOSTED_PROB) {
    const chosen = [];
    const items = pool.map((p) => ({ ...p }));

    while (chosen.length < count && items.length > 0) {
    
      const baseWeights = items.map((p) => (typeof p.weight === 'number' && p.weight > 0 ? p.weight : 1));
      let Wb = 0, Wn = 0;
      for (let i = 0; i < items.length; i++) {
        const isBoosted = (items[i].boosted === true) || ((typeof items[i].weight === 'number') && items[i].weight > 1);
        if (isBoosted) Wb += baseWeights[i]; else Wn += baseWeights[i];
      }
      let alpha = 1;
      if (Wb > 0 && Wn > 0) {
        const t = Math.max(0.0, Math.min(1.0, targetProb));
        alpha = (t * Wn) / ((1 - t) * Wb);
      }
      const weights = items.map((p, i) => {
        const boosted = (p.boosted === true) || ((typeof p.weight === 'number') && p.weight > 1);
        return (boosted ? alpha : 1) * baseWeights[i];
      });
      const total = weights.reduce((a, b) => a + b, 0);
      let r = Math.random() * total;
      let idx = -1;
      for (let i = 0; i < items.length; i++) {
        r -= weights[i];
        if (r <= 0) {
          idx = i;
          break;
        }
      }
      if (idx === -1) idx = items.length - 1;
      const pick = items.splice(idx, 1)[0];
      chosen.push(pick);
    }

    return chosen;
  }
  function weightedPick(pool, targetProb = TARGET_BOOSTED_PROB) {
    if (!Array.isArray(pool) || pool.length === 0) return undefined;
    const items = pool.map((p) => ({ ref: p }));
    const baseWeights = items.map(({ ref }) => (typeof ref.weight === 'number' && ref.weight > 0 ? ref.weight : 1));
    let Wb = 0, Wn = 0;
    for (let i = 0; i < items.length; i++) {
      const ref = items[i].ref;
      const boosted = (ref.boosted === true) || ((typeof ref.weight === 'number') && ref.weight > 1);
      if (boosted) Wb += baseWeights[i]; else Wn += baseWeights[i];
    }
    let alpha = 1;
    if (Wb > 0 && Wn > 0) {
      const t = Math.max(0.0, Math.min(1.0, targetProb));
      alpha = (t * Wn) / ((1 - t) * Wb);
    }
    const weights = items.map(({ ref }, i) => {
      const boosted = (ref.boosted === true) || ((typeof ref.weight === 'number') && ref.weight > 1);
      return (boosted ? alpha : 1) * baseWeights[i];
    });
    const total = weights.reduce((a, b) => a + b, 0);
    if (total <= 0) return pool[Math.floor(Math.random() * pool.length)];
    let r = Math.random() * total;
    for (let i = 0; i < items.length; i++) {
      r -= weights[i];
      if (r <= 0) return items[i].ref;
    }
    return items[items.length - 1].ref;
  }
  function replaceQuestion(idx, consumeReplacement = false) {
    if (!Array.isArray(generatedPaper) || !generatedPaper[idx]) return;
    const item = generatedPaper[idx];
    const lesson = item.lesson;
    const typeLabel = item.type;

    const qObj = qKeys.find(
      (qk) => qk.label === typeLabel || qk.key === typeLabel || (qk.label && qk.label.toLowerCase() === String(typeLabel).toLowerCase())
    );
    if (!qObj) return alert('Unknown question type for replacement: ' + typeLabel);
    const qKey = qObj.key;

    const pool = questionsData[lesson] && Array.isArray(questionsData[lesson][qKey]) ? questionsData[lesson][qKey] : [];
    if (pool.length === 0) return alert('No replacement questions available for this lesson/type.');

    const normalize = (s) => String(s || '').replace(/\s+/g, ' ').trim();
    const currentText = normalize(item.question);
    const available = pool.filter((q) => normalize(q.question) !== currentText);
    if (available.length === 0) return alert('No more replacement questions available for this type/lesson.');

  const newQ = weightedPick(available, TARGET_BOOSTED_PROB);
    if (!newQ) return;
    generatedPaper[idx] = {
      lesson,
      type: qObj.label,
      question: newQ.question,
      answer: newQ.answer,
      boosted: typeof newQ.weight === 'number' && newQ.weight > 1,
      weight: typeof newQ.weight === 'number' ? newQ.weight : 1,
    };

    if (consumeReplacement) {
      const removeIndex = pool.findIndex((q) => normalize(q.question) === normalize(newQ.question));
      if (removeIndex !== -1) {
        pool.splice(removeIndex, 1);
        questionsData[lesson][qKey] = pool;
        saveQuestionsToLocal();
      }
    }

    saveGeneratedPaperToLocal();
    renderPaperPreview();
  }

  function renderPaperPreview() {
    const preview = document.getElementById('paper-preview');
    if (!generatedPaper || generatedPaper.length === 0) {
      preview.innerHTML = '<div class="small">No questions selected. Set counts and click Generate.</div>';
      return;
    }
    const includeAnswersInp = document.getElementById('include-answers');
    const includeAnswers = includeAnswersInp ? !!includeAnswersInp.checked : true;
    preview.style.maxHeight = '350px';
    preview.style.overflowY = 'auto';
    preview.style.paddingBottom = '48px';

    preview.innerHTML = generatedPaper
      .map((q, idx) => `
      <div class="paper-item" style="margin-bottom: 24px;">
        <strong>${idx + 1}. ${q.type} — ${q.lesson}</strong>
        <div contenteditable="true" class="editable-question" data-idx="${idx}">${q.question}</div>
        <div class="small" style="${includeAnswers ? '' : 'display:none;'}">Ans: 
          <span contenteditable="true" class="editable-answer" data-idx="${idx}">${q.answer || '—'}</span>
        </div>
        <button class="btn small-btn replace-btn" data-idx="${idx}" style="margin-top:8px;">Replace</button>
      </div>`)
      .join('');

    $$('.replace-btn').forEach((btn) => btn.addEventListener('click', (ev) => {
      const idx = parseInt(ev.target.dataset.idx);
      replaceQuestion(idx);
    }));

    $$('.editable-question').forEach((div) => div.addEventListener('input', (ev) => {
      const idx = parseInt(ev.target.dataset.idx);
      generatedPaper[idx].question = ev.target.innerText;
      saveGeneratedPaperToLocal();
    }));
    $$('.editable-answer').forEach((div) => div.addEventListener('input', (ev) => {
      const idx = parseInt(ev.target.dataset.idx);
      generatedPaper[idx].answer = ev.target.innerText;
      saveGeneratedPaperToLocal();
    }));

    let exportBtn = document.getElementById('export-docx-btn');
    if (!exportBtn) {
      exportBtn = document.createElement('button');
      exportBtn.id = 'export-docx-btn';
      exportBtn.className = 'btn primary';
      exportBtn.textContent = 'Export Paper as DOCX';
      exportBtn.style.margin = '0 0 0 12px';
      exportBtn.onclick = async () => {
        if (!generatedPaper || generatedPaper.length === 0) return alert('No paper generated yet.');
        const includeAnswersAgain = document.getElementById('include-answers');
        const includeAns = includeAnswersAgain ? !!includeAnswersAgain.checked : true;
        try {
          await window.electronAPI.generateDocx({ title: 'Physics Question Paper', includeAnswers: includeAns, items: generatedPaper });
          alert('Saved generated docx in local generated folder.');
        } catch (err) {
          alert('Export failed: ' + (err.message || err));
        }
      };
    }
    const genBtn = document.getElementById('generate-btn');
    if (genBtn && !genBtn.parentElement.querySelector('#export-docx-btn')) {
      genBtn.parentElement.insertBefore(exportBtn, genBtn.nextSibling);
    }

    saveGeneratedPaperToLocal();
  }

  async function renderGeneratedList() {
    const cont = document.getElementById('generated-list');
    try {
      const files = await window.electronAPI.listGeneratedPapers();
      if (!files || files.length === 0) {
        cont.innerHTML = '<div class="small">No generated papers yet.</div>';
        return;
      }
      cont.innerHTML = '<ul>' + files.map((f) => `<li>${f} <div><button data-f="${f}" class="btn small-btn open">Open</button> <button data-f="${f}" class="btn small-btn del">Delete</button></div></li>`).join('') + '</ul>';
      $$('.open').forEach((b) => b.addEventListener('click', async (ev) => {
        const f = ev.target.dataset.f;
        await window.electronAPI.openFile(f);
      }));
      $$('.del').forEach((b) => b.addEventListener('click', async (ev) => {
        const f = ev.target.dataset.f;
        if (!confirm('Delete ' + f + '?')) return;
        await window.electronAPI.deleteGeneratedPaper(f);
        await renderGeneratedList();
      }));
    } catch (err) {
      cont.innerHTML = '<div class="small">Error loading generated list.</div>';
    }
  }

  async function initialScan() {
    loadSavedQuestions();
    loadSavedGeneratedPaper();
    try {
      const parsed = await window.electronAPI.readQuestions();
      if (parsed && typeof parsed === 'object') {
        questionsData = { ...questionsData, ...parsed };
        saveQuestionsToLocal();
      }
    } catch (err) {
      console.warn('initial scan failed', err);
    }
    renderGenerateScreen();
    renderUploadedFiles();
    renderGeneratedList();
    if (generatedPaper && generatedPaper.length > 0) renderPaperPreview();
  }

  initialScan();
  (function setupSupport(){
    const btn = document.getElementById('support-btn');
    const modal = document.getElementById('support-modal');
    const closeBtn = document.getElementById('support-close');
  const mail1 = document.getElementById('support-mail1');
    if (!btn || !modal) return;
    const show = () => { modal.style.display = 'flex'; };
    const hide = () => { modal.style.display = 'none'; };

    async function openGmailCompose(toAddr) {
      const subject = encodeURIComponent('Support Request');
      const body = encodeURIComponent('Hi Harish,\r\n\r\n');
      const url = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(toAddr)}&su=${subject}&body=${body}`;
      if (window.electronAPI && typeof window.electronAPI.openExternal === 'function') {
        try {
          const ok = await window.electronAPI.openExternal(url);
          if (!ok) alert('Could not open your browser. Please copy this into your browser:\n' + url);
        } catch (e) {
          alert('Could not open your browser. Please copy this into your browser:\n' + url);
        }
      } else {
        alert('Please copy this URL into your browser to compose the email:\n' + url);
      }
      hide();
    }

    btn.addEventListener('click', show);
    closeBtn && closeBtn.addEventListener('click', hide);
    modal.addEventListener('click', (e) => { if (e.target === modal) hide(); });

    if (mail1) {
      mail1.addEventListener('click', async (e) => {
        e.preventDefault();
        const addr = (mail1.textContent || '').trim() || 'dev.harish2010@gmail.com';
        await openGmailCompose(addr);
      });
    }
  })();
})();
