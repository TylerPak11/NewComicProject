const { app, BrowserWindow, shell, ipcMain } = require('electron');
const path = require('path');
const { getDatabasePath } = require('./database-config');
const { createMenu } = require('./menu');
const isDev = process.env.NODE_ENV === 'development';

// Set the database path as an environment variable for the renderer process
process.env.DB_PATH = getDatabasePath();

// Keep a global reference of the window object
let mainWindow;

function createWindow() {
  // Create the browser window
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    title: 'Comic Collection Manager',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      webSecurity: true,
      preload: path.join(__dirname, 'preload.js')
    },
    icon: path.join(__dirname, '../public/icon.png'), // Add your app icon
    show: false, // Don't show until ready-to-show
    titleBarStyle: 'default', // Use standard title bar on all platforms
    frame: true, // Ensure window frame is visible
  });

  // Load the app
  if (isDev) {
    // Try different ports in case 3000 is occupied
    const devUrl = process.env.NEXT_URL || 'http://localhost:3000';
    mainWindow.loadURL(devUrl);
    // Open DevTools in development
    mainWindow.webContents.openDevTools();
  } else {
    // In production, start a Next.js server
    const { createServer } = require('http');
    const next = require('next');
    const fs = require('fs');
    
    const nextApp = next({
      dev: false,
      dir: path.join(__dirname, '..')
    });
    
    nextApp.prepare().then(() => {
      const handle = nextApp.getRequestHandler();
      
      const server = createServer((req, res) => {
        // Handle static assets from public directory
        if (req.url.startsWith('/') && !req.url.startsWith('/api') && !req.url.startsWith('/_next')) {
          const filePath = path.join(__dirname, '..', 'public', req.url);
          try {
            if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
              const ext = path.extname(req.url).toLowerCase();
              let contentType = 'application/octet-stream';
              
              // Set appropriate content type
              if (ext === '.png') contentType = 'image/png';
              else if (ext === '.jpg' || ext === '.jpeg') contentType = 'image/jpeg';
              else if (ext === '.svg') contentType = 'image/svg+xml';
              else if (ext === '.webp') contentType = 'image/webp';
              else if (ext === '.ico') contentType = 'image/x-icon';
              
              res.writeHead(200, { 'Content-Type': contentType });
              return res.end(fs.readFileSync(filePath));
            }
          } catch (error) {
            // File not found or access error, continue to Next.js handler
          }
        }
        
        handle(req, res);
      });
      
      server.listen(3000, (err) => {
        if (err) throw err;
        console.log('> Ready on http://localhost:3000');
        mainWindow.loadURL('http://localhost:3000');
      });
    }).catch((ex) => {
      console.error(ex.stack);
      process.exit(1);
    });
  }

  // Show window when ready to prevent visual flash
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  // Create application menu
  createMenu(mainWindow);

  // Handle window closed
  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Handle external links
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });
}

// IPC handlers
ipcMain.handle('open-external', (event, url) => {
  shell.openExternal(url);
});

ipcMain.handle('get-app-version', () => {
  return app.getVersion();
});

ipcMain.handle('get-database-path', () => {
  return getDatabasePath();
});

// This method will be called when Electron has finished initialization
app.whenReady().then(createWindow);

// Quit when all windows are closed
app.on('window-all-closed', () => {
  // On macOS, keep app running even when all windows are closed
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  // On macOS, re-create window when dock icon is clicked
  if (BrowserWindow.getAllWindows().length === 0) {
    if (app.isReady()) {
      createWindow();
    } else {
      app.whenReady().then(createWindow);
    }
  }
});

// Security: Prevent new window creation
app.on('web-contents-created', (event, contents) => {
  contents.on('new-window', (navigationEvent, navigationURL) => {
    navigationEvent.preventDefault();
    shell.openExternal(navigationURL);
  });
});

// Handle protocol for deep links (optional)
app.setAsDefaultProtocolClient('comic-collection');