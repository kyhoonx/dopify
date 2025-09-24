const { app, BrowserWindow, ipcMain, globalShortcut } = require('electron');
const path = require('path');
const chokidar = require('chokidar');
const fs = require('fs').promises;
const mm = require('music-metadata');

// Development 환경 체크 - app.isPackaged는 app.whenReady() 이후에 사용
const isDev = process.env.NODE_ENV === 'development' || process.defaultApp || /[\\/]electron-prebuilt[\\/]/.test(process.execPath) || /[\\/]electron[\\/]/.test(process.execPath);

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      preload: path.join(__dirname, 'preload.js'),
      webSecurity: false // 로컬 파일 재생을 위해 필요
    },
    titleBarStyle: 'default', // 기본 타이틀바로 변경하여 드래그 가능하게
    show: false
  });

  const startUrl = isDev 
    ? 'http://localhost:3000' 
    : `file://${path.join(__dirname, '../build/index.html')}`;
  
  mainWindow.loadURL(startUrl);

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    
    // 개발자 도구는 단축키(F12, Cmd+Option+I)로만 열도록 변경
    // if (isDev) {
    //   mainWindow.webContents.openDevTools();
    // }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  createWindow();
  
  // 개발자 도구 토글 단축키 등록 (F12 또는 Cmd+Option+I)
  globalShortcut.register('F12', () => {
    const focusedWindow = BrowserWindow.getFocusedWindow();
    if (focusedWindow) {
      focusedWindow.webContents.toggleDevTools();
    }
  });
  
  globalShortcut.register('CommandOrControl+Option+I', () => {
    const focusedWindow = BrowserWindow.getFocusedWindow();
    if (focusedWindow) {
      focusedWindow.webContents.toggleDevTools();
    }
  });
});

app.on('window-all-closed', () => {
  // 전역 단축키 정리
  globalShortcut.unregisterAll();
  
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// 음악 폴더 모니터링
let watcher;
const musicFolder = path.join(__dirname, '../music');

async function scanMusicFolder() {
  try {
    const files = await fs.readdir(musicFolder);
    const musicFiles = files.filter(file => 
      file.endsWith('.mp3') || file.endsWith('.wav') || file.endsWith('.flac') || file.endsWith('.m4a')
    );

    const musicData = [];
    
    for (const file of musicFiles) {
      try {
        const filePath = path.join(musicFolder, file);
        const metadata = await mm.parseFile(filePath);
        
        musicData.push({
          id: file,
          title: metadata.common.title || file.replace(/\.[^/.]+$/, ""),
          artist: metadata.common.artist || 'Unknown Artist',
          album: metadata.common.album || 'Unknown Album',
          duration: metadata.format.duration || 0,
          filePath: filePath,
          artwork: metadata.common.picture ? metadata.common.picture[0] : null
        });
      } catch (error) {
        console.error(`Error parsing ${file}:`, error);
        // 메타데이터를 읽을 수 없는 경우 기본값 사용
        musicData.push({
          id: file,
          title: file.replace(/\.[^/.]+$/, ""),
          artist: 'Unknown Artist',
          album: 'Unknown Album',
          duration: 0,
          filePath: path.join(musicFolder, file),
          artwork: null
        });
      }
    }

    return musicData;
  } catch (error) {
    console.error('Error scanning music folder:', error);
    return [];
  }
}

// 음악 폴더 변경 감지
function watchMusicFolder() {
  if (watcher) {
    watcher.close();
  }

  watcher = chokidar.watch(musicFolder, {
    ignored: /(^|[\/\\])\../,
    persistent: true,
    ignoreInitial: true, // 초기 스캔 무시
    awaitWriteFinish: {
      stabilityThreshold: 1000,
      pollInterval: 100
    }
  });

  watcher
    .on('add', async (filePath) => {
      // 음악 파일만 처리
      if (filePath.match(/\.(mp3|wav|flac|m4a)$/i)) {
        console.log('New music file added:', filePath);
        const musicData = await scanMusicFolder();
        if (mainWindow) {
          mainWindow.webContents.send('music-files-updated', musicData);
        }
      }
    })
    .on('unlink', async (filePath) => {
      if (filePath.match(/\.(mp3|wav|flac|m4a)$/i)) {
        console.log('Music file removed:', filePath);
        const musicData = await scanMusicFolder();
        if (mainWindow) {
          mainWindow.webContents.send('music-files-updated', musicData);
        }
      }
    })
    .on('ready', () => {
      console.log('Music folder watcher ready');
    });
}

// IPC 핸들러
ipcMain.handle('get-music-files', async () => {
  return await scanMusicFolder();
});

ipcMain.handle('start-watching', () => {
  watchMusicFolder();
  return 'Watching started';
});

// 앱이 준비되면 음악 폴더 감시 시작
app.whenReady().then(() => {
  setTimeout(() => {
    watchMusicFolder();
  }, 2000);
});
