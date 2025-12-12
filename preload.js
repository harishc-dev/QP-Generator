
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  selectDocxFolder: () => ipcRenderer.invoke('select-docx-folder'),
  readQuestions: (folderPath) => ipcRenderer.invoke('read-questions', folderPath),
  generateDocx: (data) => ipcRenderer.invoke('generate-docx', data),
  uploadQuestionFiles: (files) => ipcRenderer.invoke('upload-question-files', files),
  listUploadedQuestions: () => ipcRenderer.invoke('list-uploaded-questions'),
  deleteUploadedQuestion: (filename) => ipcRenderer.invoke('delete-uploaded-question', filename),
  listGeneratedPapers: () => ipcRenderer.invoke('list-generated-papers'),
  deleteGeneratedPaper: (filename) => ipcRenderer.invoke('delete-generated-paper', filename),
  openExternal: (url) => ipcRenderer.invoke('open-external', url),
  windowControl: (action) => ipcRenderer.send('window-control', action),
  openFile: (filePath) => ipcRenderer.invoke('open-file', filePath)
});
