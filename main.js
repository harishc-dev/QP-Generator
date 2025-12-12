
const fs = require('fs');
const { app, BrowserWindow, ipcMain, dialog, shell } = require('electron');
const path = require('path');
const { generateDocx } = require('./utils/docxExport');
const { parseQuestions } = require('./utils/questionParser');

let LOG_FILE = null;
function log(...args) {
  try {
    const line = `[${new Date().toISOString()}] ` + args.map(a => (typeof a === 'string' ? a : JSON.stringify(a))).join(' ') + "\n";
    if (LOG_FILE) fs.appendFileSync(LOG_FILE, line);
  } catch {}
}

ipcMain.handle('open-file', async (event, fileName) => {
  const filePath = path.join(GENERATED_DIR, fileName);
  if (fs.existsSync(filePath)) {
    await shell.openPath(filePath);
    return true;
  }
  return false;
});

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    show: false,
    frame: false,
    titleBarStyle: 'hidden',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true
    }
  });
  win.once('ready-to-show', () => { log('ready-to-show'); win.show(); win.focus(); });
  win.webContents.on('did-finish-load', () => { log('did-finish-load'); try { win.show(); win.focus(); } catch {} });
  win.webContents.on('did-fail-load', (e, code, desc, url) => { log('did-fail-load', code, desc, url); try { win.show(); } catch {} });
  win.webContents.on('render-process-gone', (e, details) => { log('render-process-gone', details); });
  win.loadFile(path.join(__dirname, 'index.html')).catch(err => log('loadFile error', err && err.message));
  setTimeout(() => { try { if (!win.isVisible()) { log('fallback show'); win.show(); win.focus(); } } catch {} }, 2000);
}

let UPLOAD_DIR;
let GENERATED_DIR;
function initAppDirs() {
  const base = path.join(app.getPath('userData'), 'QPGen');
  ensureDir(base);
  UPLOAD_DIR = path.join(base, 'qp');
  GENERATED_DIR = path.join(base, 'generated');
  ensureDir(UPLOAD_DIR);
  ensureDir(GENERATED_DIR);
  LOG_FILE = path.join(base, 'qpgen.log');
  try { fs.appendFileSync(LOG_FILE, `\n--- App start ${new Date().toISOString()} ---\n`); } catch {}
}

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

app.whenReady().then(() => {
  try { initAppDirs(); } catch (e) { console.error('initAppDirs failed', e); }
  createWindow();
  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});

ipcMain.handle('select-docx-folder', async () => {
  const result = await dialog.showOpenDialog({ properties: ['openDirectory'] });
  return result.filePaths && result.filePaths[0];
});

ipcMain.handle('read-questions', async () => {
  if (!UPLOAD_DIR || !GENERATED_DIR) initAppDirs();
  try {
    const res = await parseQuestions(UPLOAD_DIR);
    log('read-questions ok');
    return res;
  } catch (err) {
    console.error('read-questions error', err); log('read-questions error', err && err.message);
    return {};
  }
});

ipcMain.handle('generate-docx', async (event, data) => {
  try {
    if (!UPLOAD_DIR || !GENERATED_DIR) initAppDirs();
    const outputPath = await generateDocx(data, GENERATED_DIR);
    log('generate-docx ok', outputPath);
    return { success: true, path: outputPath };
  } catch (err) {
    console.error('generate-docx error', err); log('generate-docx error', err && err.message);
    throw err;
  }
});

ipcMain.handle('upload-question-files', async (event, files) => {
  if (!UPLOAD_DIR || !GENERATED_DIR) initAppDirs();
  const saved = [];
  for (const file of files) {
    const dest = path.join(UPLOAD_DIR, path.basename(file.path));
    try {
      fs.copyFileSync(file.path, dest);
      saved.push(path.basename(file.path));
    } catch (err) {
      console.warn('copy error', err); log('copy error', err && err.message);
    }
  }
  return saved;
});

ipcMain.handle('list-uploaded-questions', async () => {
  if (!UPLOAD_DIR || !GENERATED_DIR) initAppDirs();
  return fs.readdirSync(UPLOAD_DIR).filter(f => f.endsWith('.docx'));
});

ipcMain.handle('delete-uploaded-question', async (event, filename) => {
  const file = path.join(UPLOAD_DIR, filename);
  if (fs.existsSync(file)) fs.unlinkSync(file);
  return true;
});

ipcMain.handle('list-generated-papers', async () => {
  if (!UPLOAD_DIR || !GENERATED_DIR) initAppDirs();
  return fs.readdirSync(GENERATED_DIR).filter(f => f.endsWith('.docx'));
});

ipcMain.handle('delete-generated-paper', async (event, filename) => {
  const file = path.join(GENERATED_DIR, filename);
  if (fs.existsSync(file)) fs.unlinkSync(file);
  return true;
});

ipcMain.handle('open-external', async (event, url) => {
  try {
    await shell.openExternal(url);
    log('open-external ok', url);
    return true;
  } catch (err) {
    console.error('open-external error', err); log('open-external error', err && err.message);
    return false;
  }
});

ipcMain.on('window-control', (event, action) => {
  const win = BrowserWindow.getFocusedWindow();
  if (!win) return;
  if (action === 'minimize') win.minimize();
  else if (action === 'maximize') win.isMaximized() ? win.unmaximize() : win.maximize();
  else if (action === 'close') win.close();
});

process.on('uncaughtException', (err) => { console.error('uncaughtException', err); log('uncaughtException', err && err.stack); });
process.on('unhandledRejection', (reason) => { console.error('unhandledRejection', reason); log('unhandledRejection', reason && (reason.stack || reason)); });
