const { app, BrowserWindow, ipcMain, globalShortcut, shell, dialog } = require('electron');
const path = require('path');
const chokidar = require('chokidar');
const fs = require('fs').promises;
const mm = require('music-metadata');
const Store = require('electron-store');
const axios = require('axios'); // axios 추가

const store = new Store();

// Spotify 토큰 캐시
let spotifyTokenCache = {
  token: null,
  expiresAt: 0
};

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
    show: false,
    icon: path.join(__dirname, isDev ? '../assets/icon.png' : '../assets/icon.png')
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
let musicFolder = store.get('musicFolder');

// 기본 음악 폴더가 없으면 기본값 설정 (단, 사용은 안 함)
if (!musicFolder) {
  musicFolder = path.join(app.getPath('music'), 'DopifyMusic');
  // store.set('musicFolder', musicFolder); // 자동 저장은 하지 않음 (사용자 선택 유도)
}

async function scanMusicFolder(folderPath = musicFolder) {
  if (!folderPath) return [];

  try {
    // 폴더가 없으면 생성 시도 (기본 폴더일 경우)
    try {
      await fs.access(folderPath);
    } catch {
      // 사용자가 지정한 폴더가 없으면 빈 배열 반환
      return [];
    }

    const files = await fs.readdir(folderPath);
    const musicFiles = files.filter(file => 
      file.endsWith('.mp3') || file.endsWith('.wav') || file.endsWith('.flac') || file.endsWith('.m4a')
    );

    const musicData = [];
    
    for (const file of musicFiles) {
      try {
        const filePath = path.join(folderPath, file);
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
          filePath: path.join(folderPath, file),
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
function watchMusicFolder(folderPath = musicFolder) {
  if (!folderPath) return;

  if (watcher) {
    watcher.close();
  }

  watcher = chokidar.watch(folderPath, {
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
        const musicData = await scanMusicFolder(folderPath);
        if (mainWindow) {
          mainWindow.webContents.send('music-files-updated', musicData);
        }
      }
    })
    .on('unlink', async (filePath) => {
      if (filePath.match(/\.(mp3|wav|flac|m4a)$/i)) {
        console.log('Music file removed:', filePath);
        const musicData = await scanMusicFolder(folderPath);
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

// 음악 폴더 선택 핸들러
ipcMain.handle('select-music-folder', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openDirectory']
  });

  if (!result.canceled && result.filePaths.length > 0) {
    const selectedFolder = result.filePaths[0];
    store.set('musicFolder', selectedFolder);
    musicFolder = selectedFolder;
    
    // 새 폴더로 감시 시작 및 스캔
    watchMusicFolder(selectedFolder);
    return await scanMusicFolder(selectedFolder);
  }
  return null;
});

ipcMain.handle('get-music-folder', () => {
  return store.get('musicFolder');
});

ipcMain.handle('open-external-link', async (event, url) => {
  await shell.openExternal(url);
});

// API Key 관리
ipcMain.handle('get-api-keys', () => {
  return {
    geminiApiKey: store.get('geminiApiKey'),
    spotifyClientId: store.get('spotifyClientId'),
    spotifyClientSecret: store.get('spotifyClientSecret')
  };
});

ipcMain.handle('save-api-keys', (event, keys) => {
  if (keys.geminiApiKey) store.set('geminiApiKey', keys.geminiApiKey);
  if (keys.spotifyClientId) store.set('spotifyClientId', keys.spotifyClientId);
  if (keys.spotifyClientSecret) store.set('spotifyClientSecret', keys.spotifyClientSecret);
  return true;
});

// Spotify API 핸들러
ipcMain.handle('search-spotify-artist', async (event, artistName) => {
  try {
    const clientId = store.get('spotifyClientId');
    const clientSecret = store.get('spotifyClientSecret');

    if (!clientId || !clientSecret) {
      console.log('Spotify keys not found');
      return null;
    }

    // 1. 토큰 확인 및 갱신
    const now = Date.now();
    if (!spotifyTokenCache.token || now > spotifyTokenCache.expiresAt) {
        const authString = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

        try {
          const tokenResponse = await axios({
            url: 'https://accounts.spotify.com/api/token',
            method: 'POST',
            headers: {
              'Authorization': `Basic ${authString}`,
              'Content-Type': 'application/x-www-form-urlencoded'
            },
            data: 'grant_type=client_credentials'
          });

          const expiresIn = tokenResponse.data.expires_in;
          spotifyTokenCache.token = tokenResponse.data.access_token;
          spotifyTokenCache.expiresAt = now + ((expiresIn - 300) * 1000); // 5분 여유
          console.log('✅ Spotify 토큰 갱신 완료 (Electron Main)');
        } catch (tokenError) {
          console.error('Spotify 토큰 발급 실패:', tokenError.response?.data || tokenError.message);
          return null;
        }
    }

    const accessToken = spotifyTokenCache.token;

    // 2. 아티스트 검색
    const searchResponse = await axios({
      url: `https://api.spotify.com/v1/search?q=${encodeURIComponent(artistName)}&type=artist&limit=1`,
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });

    const artists = searchResponse.data.artists.items;
    
    let result = { imageUrl: null, genres: [], followers: 0, popularity: 0, url: null };

    if (artists && artists.length > 0) {
      const artistData = artists[0];
      
      if (artistData.images && artistData.images.length > 0) {
        result.imageUrl = artistData.images[0].url;
      }
      if (artistData.genres) result.genres = artistData.genres.slice(0, 3);
      if (artistData.followers) result.followers = artistData.followers.total;
      if (artistData.popularity) result.popularity = artistData.popularity;
      if (artistData.external_urls?.spotify) result.url = artistData.external_urls.spotify;
      
      return result;
    }
    
    return null;

  } catch (error) {
    console.error(`❌ Spotify API 오류 (Main): ${error.message}`);
    return null;
  }
});

ipcMain.handle('get-api-key', () => {
  return store.get('geminiApiKey');
});

ipcMain.handle('save-api-key', (event, key) => {
  store.set('geminiApiKey', key);
  return true;
});

// 앱이 준비되면 음악 폴더 감시 시작
app.whenReady().then(() => {
  setTimeout(() => {
    watchMusicFolder();
  }, 2000);
});
