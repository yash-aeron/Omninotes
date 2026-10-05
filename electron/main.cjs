const { app, BrowserWindow, globalShortcut, Menu, nativeImage } = require('electron');
const path = require('path');
const fs = require('fs');

// Register Windows App User Model ID so it groups nicely on the Taskbar & Start Menu
if (process.platform === 'win32') {
  app.setAppUserModelId('com.omninotes.desktop');
}

const logFile = path.join(app.getPath('userData'), 'omninotes-desktop.log');
function log(msg) {
  try {
    fs.appendFileSync(logFile, `[${new Date().toISOString()}] ${msg}\n`);
  } catch {}
}

log('OmniNotes Desktop starting...');
log(`App path: ${app.getAppPath()}`);
log(`User data path: ${app.getPath('userData')}`);

let mainWindow = null;

// Enable touch and pen events flag in Chromium for low-latency stylus drawing
app.commandLine.appendSwitch('enable-experimental-web-platform-features');
app.commandLine.appendSwitch('enable-pointer-lock-options');
app.commandLine.appendSwitch('high-dpi-support', '1');
app.commandLine.appendSwitch('disable-features', 'OutOfBlinkCors');
app.commandLine.appendSwitch('allow-file-access-from-files');

function createWindow() {
  log('createWindow() called');
  try {
    const iconCandidates = [
      path.join(__dirname, '..', 'public', 'app-icon.ico'),
      path.join(__dirname, '..', 'public', 'app-icon.png'),
      path.join(app.getAppPath(), 'public', 'app-icon.png'),
      path.join(__dirname, 'app-icon.ico')
    ];
    const iconPath = iconCandidates.find(p => fs.existsSync(p));

    mainWindow = new BrowserWindow({
      width: 1400,
      height: 900,
      minWidth: 960,
      minHeight: 640,
      title: 'Omninotes',
      backgroundColor: '#090a0f',
      show: true,
      autoHideMenuBar: false,
      icon: iconPath,
      webPreferences: {
        preload: path.join(__dirname, 'preload.cjs'),
        nodeIntegration: false,
        contextIsolation: true,
        webSecurity: false, // Critical: enables file:// to load Vite ES modules without CORS errors
        allowRunningInsecureContent: false,
        sandbox: false,
      },
    });

    // Capture renderer console messages for diagnostics
    mainWindow.webContents.on('console-message', (event, level, message, line, sourceId) => {
      log(`[RENDERER CONSOLE ${level}] ${message} (${sourceId}:${line})`);
    });

    const candidates = [
      path.join(__dirname, '..', 'dist', 'index.html'),
      path.join(app.getAppPath(), 'dist', 'index.html'),
      path.join(__dirname, 'dist', 'index.html'),
    ];
    const distIndex = candidates.find(p => fs.existsSync(p));
    log(`Resolved distIndex: ${distIndex}`);

    if (distIndex) {
      log(`Loading file: ${distIndex}`);
      mainWindow.loadFile(distIndex);
    } else {
      log('Loading dev URL http://localhost:1420');
      mainWindow.loadURL('http://localhost:1420').catch((err) => {
        log(`loadURL error: ${err.message}`);
      });
    }

    mainWindow.once('ready-to-show', () => {
      log('Window ready-to-show');
      mainWindow.show();
      mainWindow.focus();
      // Ensure window is brought to front in Windows interactive session
      mainWindow.setAlwaysOnTop(true);
      setTimeout(() => {
        if (mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.setAlwaysOnTop(false);
        }
      }, 600);
    });

    mainWindow.webContents.on('did-finish-load', () => {
      log('did-finish-load success!');
    });

    mainWindow.webContents.on('did-fail-load', (e, code, desc) => {
      log(`did-fail-load: code ${code}, desc ${desc}`);
    });

    mainWindow.on('closed', () => {
      log('mainWindow closed');
      mainWindow = null;
    });

    // Native Application Menu
    const menuTemplate = [
      {
        label: 'File',
        submenu: [
          {
            label: 'New Page',
            accelerator: 'CmdOrCtrl+N',
            click: () => mainWindow && mainWindow.webContents.send('menu:new-page'),
          },
          {
            label: 'Quick Capture',
            accelerator: 'CmdOrCtrl+Shift+N',
            click: () => mainWindow && mainWindow.webContents.send('quick-capture'),
          },
          {
            label: 'Toggle Sidebar',
            accelerator: 'CmdOrCtrl+B',
            click: () => mainWindow && mainWindow.webContents.send('menu:toggle-sidebar'),
          },
          { type: 'separator' },
          { role: 'quit' },
        ],
      },
      {
        label: 'Edit',
        submenu: [
          { role: 'undo' },
          { role: 'redo' },
          { type: 'separator' },
          { role: 'cut' },
          { role: 'copy' },
          { role: 'paste' },
          { role: 'selectAll' },
        ],
      },
      {
        label: 'View',
        submenu: [
          { role: 'reload' },
          { role: 'forceReload' },
          { role: 'toggleDevTools' },
          { type: 'separator' },
          { role: 'resetZoom' },
          { role: 'zoomIn' },
          { role: 'zoomOut' },
          { type: 'separator' },
          { role: 'togglefullscreen' },
        ],
      },
    ];

    const menu = Menu.buildFromTemplate(menuTemplate);
    Menu.setApplicationMenu(menu);

  } catch (err) {
    log(`createWindow error: ${err.stack || err.message}`);
  }
}

app.whenReady().then(() => {
  log('app.whenReady resolved');
  createWindow();

  try {
    globalShortcut.register('CommandOrControl+Shift+N', () => {
      if (mainWindow) {
        if (mainWindow.isMinimized()) mainWindow.restore();
        mainWindow.show();
        mainWindow.focus();
        mainWindow.webContents.send('quick-capture');
      }
    });
  } catch (err) {
    log(`globalShortcut error: ${err.message}`);
  }

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  log('window-all-closed event');
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

process.on('uncaughtException', (err) => {
  log(`uncaughtException: ${err.stack || err.message}`);
});
