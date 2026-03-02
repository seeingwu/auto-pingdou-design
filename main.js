const { app, BrowserWindow } = require('electron');
const electronServe = require('electron-serve');

const serve = electronServe.default || electronServe;
const loadURL = serve({ directory: 'out' });

const createWindow = async () => {
    const win = new BrowserWindow({
        width: 1280,
        height: 800,
        webPreferences: {
            nodeIntegration: true,
        }
    });

    if (app.isPackaged) {
        await loadURL(win);
    } else {
        // In dev mode, wait for Next.js to start
        win.loadURL('http://localhost:3001');
        win.webContents.openDevTools();
    }
};

app.whenReady().then(() => {
    createWindow();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});
