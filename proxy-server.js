/**
 * Gemini API용 간단한 프록시 서버
 * CORS 문제를 해결하기 위해 사용
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');

// Node.js 버전에 따른 fetch 처리
let fetch;
try {
  // Node.js 18+ 에서는 글로벌 fetch 사용
  fetch = globalThis.fetch;
} catch (error) {
  // 이전 버전에서는 node-fetch 사용
  fetch = require('node-fetch');
}

// fetch 대신 axios 직접 사용
const axios = require('axios');

const app = express();
const PORT = 3001;

// CORS 허용
app.use(cors());
app.use(express.json());

// Gemini API 프록시 엔드포인트
app.post('/api/gemini', async (req, res) => {
  try {
    console.log('프록시 요청 받음:', new Date().toISOString());
    
    const { apiKey, requestBody, model = 'gemini-1.5-flash' } = req.body;
    
    // 클라이언트에서 보낸 키가 없거나 기본값이면 서버 환경변수 사용
    const effectiveApiKey = (!apiKey || apiKey === 'API_KEY_NOT_CONFIGURED') 
      ? process.env.GEMINI_API_KEY 
      : apiKey;

    if (!effectiveApiKey || !requestBody) {
      console.error('❌ API 키 누락');
      return res.status(400).json({ 
        error: 'API 키가 필요합니다. .env 파일을 확인하거나 REACT_APP_GEMINI_API_KEY를 설정하세요.' 
      });
    }

    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${effectiveApiKey}`;
    
    console.log(`🔗 Gemini API 요청 URL: ${geminiUrl.replace(effectiveApiKey, 'HIDDEN_KEY')}`); // URL 확인용 로그 (키는 숨김)

    const response = await axios({
      url: geminiUrl,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      data: requestBody
    });

    console.log(`✅ Gemini API 성공 (${response.status})`);
    
    res.json(response.data);
    
  } catch (error) {
    console.error('프록시 서버 오류:', error);
    
    if (error.response) {
      console.error(`❌ Gemini API 오류 (${error.response.status}):`, error.response.data);
      res.status(error.response.status).json(error.response.data);
    } else {
      console.error('❌ 프록시 서버 오류:', error.message);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  }
});

// Spotify API 엔드포인트
app.get('/api/spotify/artist-image', async (req, res) => {
  try {
    const { artist } = req.query;
    if (!artist) {
      return res.status(400).json({ error: 'Artist name is required' });
    }

    // 캐싱: 메모리 캐시 (간단한 객체 사용)
    // 실제 프로덕션에서는 Redis 등을 사용해야 함
    if (!global.spotifyTokenCache) {
      global.spotifyTokenCache = {
        token: null,
        expiresAt: 0
      };
    }

    const clientId = process.env.SPOTIFY_CLIENT_ID;
    const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      console.error('❌ Spotify API 키 누락');
      return res.status(500).json({ error: 'Spotify API not configured' });
    }

    // 1. 토큰 확인 및 갱신 (캐싱 적용)
    const now = Date.now();
    if (!global.spotifyTokenCache.token || now > global.spotifyTokenCache.expiresAt) {
        // ... (토큰 갱신 로직 생략) ...
        const authString = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

        const tokenResponse = await axios({
          url: 'https://accounts.spotify.com/api/token',
          method: 'POST',
          headers: {
            'Authorization': `Basic ${authString}`,
            'Content-Type': 'application/x-www-form-urlencoded'
          },
          data: 'grant_type=client_credentials'
        });

        const expiresIn = tokenResponse.data.expires_in; // 보통 3600초 (1시간)
        global.spotifyTokenCache.token = tokenResponse.data.access_token;
        // 만료 5분 전(300초)에 미리 갱신하도록 설정
        global.spotifyTokenCache.expiresAt = now + ((expiresIn - 300) * 1000);
        console.log('✅ Spotify 토큰 갱신 완료');
    }

    const accessToken = global.spotifyTokenCache.token;

    // 2. 아티스트 검색
    const searchResponse = await axios({
      url: `https://api.spotify.com/v1/search?q=${encodeURIComponent(artist)}&type=artist&limit=1`,
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });

    const artists = searchResponse.data.artists.items;
    
    let result = { imageUrl: null, genres: [], followers: 0, popularity: 0, url: null };

    if (artists && artists.length > 0) {
      const artistData = artists[0];
      
      // 이미지
      if (artistData.images && artistData.images.length > 0) {
        result.imageUrl = artistData.images[0].url;
      }
      
      // 장르 (최대 3개)
      if (artistData.genres) {
        result.genres = artistData.genres.slice(0, 3);
      }
      
      // 팔로워 수
      if (artistData.followers) {
        result.followers = artistData.followers.total;
      }
      
      // 인기도 (0-100)
      if (artistData.popularity) {
        result.popularity = artistData.popularity;
      }

      // 아티스트 URL
      if (artistData.external_urls && artistData.external_urls.spotify) {
        result.url = artistData.external_urls.spotify;
      }

      console.log(`🎵 Spotify 데이터 발견 (${artist}): ${result.imageUrl ? '이미지 있음' : '이미지 없음'}`);
      res.json(result);
    } else {
      console.log(`💨 Spotify 데이터 없음 (${artist})`);
      res.json(result);
    }

  } catch (error) {
    console.error(`❌ Spotify API 오류: ${error.message}`);
    res.json({ imageUrl: null, error: error.message });
  }
});

// 서버 상태 체크 엔드포인트
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`🚀 Gemini API 프록시 서버가 http://localhost:${PORT}에서 실행 중입니다.`);
  console.log(`📡 API 엔드포인트: http://localhost:${PORT}/api/gemini`);
});
