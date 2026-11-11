const path = require('node:path');
const { app, BrowserWindow, shell } = require('electron');

function createMainWindow() {
  const iconPath = app.isPackaged
    ? path.join(__dirname, '../dist/pwa-512x512.png')
    : path.join(__dirname, '../public/pwa-512x512.png');

  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 380,
    minHeight: 600,
    title: 'Gestor de Entregas - Ponto 10',
    icon: iconPath,
    autoHideMenuBar: true,
    backgroundColor: '#f8fafc',
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('http://') || url.startsWith('https://')) {
      void shell.openExternal(url);
    }
    return { action: 'deny' };
  });

  const startUrl = process.env.ELECTRON_START_URL;
  if (startUrl) {
    void mainWindow.loadURL(startUrl);
  } else {
    void mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }
}

app.whenReady().then(() => {
  createMainWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
