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
    
    if (!apiKey || !requestBody) {
      return res.status(400).json({ 
        error: 'API 키와 요청 본문이 필요합니다.' 
      });
    }

    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
    
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

// 서버 상태 체크 엔드포인트
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`🚀 Gemini API 프록시 서버가 http://localhost:${PORT}에서 실행 중입니다.`);
  console.log(`📡 API 엔드포인트: http://localhost:${PORT}/api/gemini`);
});
