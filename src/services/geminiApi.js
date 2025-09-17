/**
 * Google Gemini API 서비스
 * 음악 정보를 Gemini API를 통해 가져오는 기능
 */

// 환경변수에서 API 키 로드 (React 앱에서는 REACT_APP_ 접두사 필요)
const GEMINI_API_KEY = process.env.REACT_APP_GEMINI_API_KEY || 'API_KEY_NOT_CONFIGURED';
// 사용 가능한 Gemini 모델들 (fallback 순서)
const GEMINI_MODELS = [
  'gemini-1.5-flash',
  'gemini-1.5-pro',
  'gemini-pro'
];

const GEMINI_API_BASE_URL = 'https://generativelanguage.googleapis.com/v1beta/models';

// 현재 사용할 모델 (fallback 시 변경됨)
let currentModelIndex = 0;

function getGeminiApiUrl() {
  const model = GEMINI_MODELS[currentModelIndex];
  return `${GEMINI_API_BASE_URL}/${model}:generateContent`;
}

// 로컬 프록시 서버 설정
const PROXY_SERVER_URL = 'http://localhost:3001/api/gemini';
const USE_PROXY = true; // 프록시 사용 여부 (CORS 해결을 위해 기본 활성화)

// 캐시 저장소 (로컬 스토리지 기반)
const CACHE_KEY_PREFIX = 'gemini_music_cache_';
const CACHE_EXPIRY_HOURS = 24; // 24시간 후 만료

/**
 * 캐시에서 데이터 가져오기
 * @param {string} cacheKey - 캐시 키
 * @returns {Object|null} 캐시된 데이터 또는 null
 */
export function getCachedData(cacheKey) {
  try {
    const fullCacheKey = CACHE_KEY_PREFIX + cacheKey;
    console.log('🔍 캐시 조회:', { cacheKey, fullCacheKey });
    
    const cached = localStorage.getItem(fullCacheKey);
    console.log('📂 localStorage 조회 결과:', { found: !!cached });
    
    if (!cached) {
      // 모든 Gemini 캐시 키 확인
      const allKeys = Object.keys(localStorage).filter(key => key.startsWith(CACHE_KEY_PREFIX));
      console.log('📋 현재 저장된 모든 캐시 키들:', allKeys);
      return null;
    }

    const { data, timestamp } = JSON.parse(cached);
    const now = Date.now();
    const expiryTime = timestamp + (CACHE_EXPIRY_HOURS * 60 * 60 * 1000);

    if (now > expiryTime) {
      localStorage.removeItem(fullCacheKey);
      return null;
    }

    // 실패한 데이터나 에러가 포함된 캐시 확인
    if (data && (data._isError || data.error || !data.artist || !data.album || !data.track)) {
      localStorage.removeItem(fullCacheKey);
      return null;
    }

    console.log('✅ 캐시된 음악 정보 반환:', `${data.artist?.name} - ${data.track?.name}`);
    return data;
  } catch (error) {
    console.error('❌ 캐시 데이터 읽기 실패:', error);
    // 손상된 캐시 항목 삭제
    localStorage.removeItem(CACHE_KEY_PREFIX + cacheKey);
    return null;
  }
}

/**
 * 캐시에 데이터 저장
 * @param {string} cacheKey - 캐시 키
 * @param {Object} data - 저장할 데이터
 */
function setCachedData(cacheKey, data) {
  try {
    const fullCacheKey = CACHE_KEY_PREFIX + cacheKey;
    const cacheData = {
      data,
      timestamp: Date.now()
    };
    
    localStorage.setItem(fullCacheKey, JSON.stringify(cacheData));
    console.log('💾 캐시 저장:', `${data.artist?.name} - ${data.track?.name}`);
  } catch (error) {
    console.error('❌ 캐시 데이터 저장 실패:', error);
  }
}

/**
 * 캐시 클리어
 * @param {string} cacheKey - 특정 캐시 키 (선택사항)
 */
export function clearCache(cacheKey = null) {
  try {
    if (cacheKey) {
      const fullCacheKey = CACHE_KEY_PREFIX + cacheKey;
      console.log('🗑️ 특정 캐시 삭제:', { cacheKey, fullCacheKey });
      localStorage.removeItem(fullCacheKey);
      console.log('✅ 캐시 삭제 완료:', cacheKey);
    } else {
      console.log('🗑️ 모든 캐시 삭제 시작');
      // 모든 Gemini 캐시 클리어
      const keys = Object.keys(localStorage);
      const geminiKeys = keys.filter(key => key.startsWith(CACHE_KEY_PREFIX));
      console.log('🗑️ 삭제할 캐시 키들:', geminiKeys);
      
      geminiKeys.forEach(key => {
        localStorage.removeItem(key);
      });
      console.log('✅ 모든 캐시 삭제 완료');
    }
  } catch (error) {
    console.error('❌ 캐시 클리어 실패:', error);
  }
}

/**
 * 재시도 로직이 포함된 Gemini API 호출
 * @param {string} artist - 아티스트 이름
 * @param {string} album - 앨범 이름
 * @param {string} track - 트랙 이름
 * @param {AbortSignal} signal - 요청 취소를 위한 AbortSignal
 * @param {number} retryCount - 현재 재시도 횟수
 * @returns {Promise<Object>} 음악 정보 객체
 */
async function fetchMusicInfoWithRetry(artist, album, track, signal, retryCount = 0) {
  const MAX_RETRIES = 3;
  const RETRY_DELAYS = [2000, 5000, 10000]; // 2초, 5초, 10초

  try {
    return await fetchMusicInfoFromGeminiInternal(artist, album, track, signal);
  } catch (error) {
    if (error.name === 'AbortError') {
      throw error; // 사용자 취소는 재시도하지 않음
    }

    // 503 오류이고 재시도 횟수가 남아있으면 재시도
    if (error.message.includes('503') || error.message.includes('overloaded')) {
      if (retryCount < MAX_RETRIES) {
        const delay = RETRY_DELAYS[retryCount] || RETRY_DELAYS[RETRY_DELAYS.length - 1];
        console.log(`503 오류 감지됨. ${delay/1000}초 후 재시도... (${retryCount + 1}/${MAX_RETRIES})`);
        
        // 지연 시간 동안 대기
        await new Promise(resolve => setTimeout(resolve, delay));
        
        // 재시도
        return await fetchMusicInfoWithRetry(artist, album, track, signal, retryCount + 1);
      }
    }
    
    throw error; // 재시도 불가능한 오류이거나 최대 재시도 횟수 초과
  }
}

/**
 * Gemini API를 사용하여 음악 정보 생성 (외부 인터페이스)
 * @param {string} artist - 아티스트 이름
 * @param {string} album - 앨범 이름
 * @param {string} track - 트랙 이름
 * @param {AbortSignal} signal - 요청 취소를 위한 AbortSignal
 * @returns {Promise<Object>} 음악 정보 객체
 */
export async function fetchMusicInfoFromGemini(artist, album, track, signal) {
  return await fetchMusicInfoWithRetry(artist, album, track, signal);
}

/**
 * 실제 Gemini API 호출 로직 (내부 함수)
 * @param {string} artist - 아티스트 이름
 * @param {string} album - 앨범 이름
 * @param {string} track - 트랙 이름
 * @param {AbortSignal} signal - 요청 취소를 위한 AbortSignal
 * @returns {Promise<Object>} 음악 정보 객체
 */
async function fetchMusicInfoFromGeminiInternal(artist, album, track, signal) {
  const cacheKey = `${artist}_${album}_${track}`.toLowerCase().replace(/[^a-z0-9_]/g, '_');
  
  // 캐시된 데이터 확인
  const cachedData = getCachedData(cacheKey);
  if (cachedData) {
    console.log('캐시된 음악 정보 반환:', artist, '-', track);
    return cachedData;
  }

  console.log('Gemini API로 음악 정보 요청:', artist, '-', track);

  const prompt = `
다음 음악에 대한 상세 정보를 제공해주세요. 정확한 정보가 없다면 일반적이고 합리적인 추정을 해주세요.

아티스트: ${artist}
앨범: ${album}
트랙: ${track}

다음 JSON 형식으로 응답해주세요:
{
  "artist": {
    "name": "아티스트명",
    "bio": "아티스트에 대한 흥미로운 설명 (200자 이내)",
    "genre": "주요 장르",
    "country": "출신 국가",
    "activeYears": "활동 연도"
  },
  "album": {
    "name": "앨범명",
    "releaseDate": "발매일 (YYYY-MM-DD 형식)",
    "description": "앨범에 대한 흥미로운 설명 (300자 이내)",
    "tracks": 트랙수,
    "duration": "총 재생시간 (MM:SS 형식)",
    "label": "레코드 레이블"
  },
  "track": {
    "name": "트랙명",
    "duration": "재생시간 (MM:SS 형식)",
    "trackNumber": 트랙번호,
    "themes": "곡의 주요 테마나 의미"
  },
  "recommendations": [
    {
      "artist": "추천 아티스트1",
      "track": "추천 곡1",
      "reason": "추천 이유"
    },
    {
      "artist": "추천 아티스트2", 
      "track": "추천 곡2",
      "reason": "추천 이유"
    },
    {
      "artist": "추천 아티스트3",
      "track": "추천 곡3", 
      "reason": "추천 이유"
    }
  ],
  "funFacts": [
    "재미있는 사실 1",
    "재미있는 사실 2",
    "재미있는 사실 3"
  ]
}

JSON 외의 다른 텍스트는 포함하지 말고, 정확한 JSON 형식으로만 응답해주세요.
`;

  try {
    const requestBody = {
      contents: [{
        parts: [{
          text: prompt
        }]
      }]
    };

    console.log('Gemini API 요청 시작:', {
      method: 'POST',
      useProxy: USE_PROXY,
      artist,
      track
    });

    let response;

    if (USE_PROXY) {
      // 프록시 서버를 통한 요청
      const proxyRequestBody = {
        apiKey: GEMINI_API_KEY,
        requestBody: requestBody,
        model: GEMINI_MODELS[currentModelIndex] // 현재 모델 전달
      };

      response = await fetch(PROXY_SERVER_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(proxyRequestBody),
        signal
      });
    } else {
      // 직접 API 호출 (CORS 문제가 있을 수 있음)
      const apiUrl = getGeminiApiUrl();
      response = await fetch(`${apiUrl}?key=${GEMINI_API_KEY}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
        signal
      });
    }

    console.log('Gemini API 응답 상태:', response.status, response.statusText);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Gemini API 오류 응답:', errorText);
      throw new Error(`API 요청 실패: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const data = await response.json();
    console.log('Gemini API 응답 데이터 전체:', data);
    console.log('응답 구조 확인:', {
      hasCandidates: !!data.candidates,
      candidatesLength: data.candidates?.length,
      firstCandidate: data.candidates?.[0],
      firstCandidateContent: data.candidates?.[0]?.content,
      firstCandidateParts: data.candidates?.[0]?.content?.parts
    });
    
    if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
      throw new Error('API 응답 형식이 올바르지 않습니다.');
    }

    const generatedText = data.candidates[0].content.parts[0].text;
    console.log('Gemini가 생성한 텍스트:', generatedText);
    console.log('텍스트 길이:', generatedText.length);
    
    // JSON 파싱 시도
    let musicInfo;
    try {
      // JSON 텍스트 정리 (앞뒤 공백, 코드 블록 마크다운 제거)
      let cleanedText = generatedText.trim();
      if (cleanedText.startsWith('```json')) {
        cleanedText = cleanedText.replace(/^```json\s*/, '').replace(/\s*```$/, '');
      } else if (cleanedText.startsWith('```')) {
        cleanedText = cleanedText.replace(/^```\s*/, '').replace(/\s*```$/, '');
      }
      
      console.log('정리된 JSON 텍스트:', cleanedText);
      musicInfo = JSON.parse(cleanedText);
      console.log('JSON 파싱 성공:', musicInfo);
    } catch (parseError) {
      console.error('JSON 파싱 실패:', parseError);
      console.error('파싱 실패한 텍스트:', generatedText);
      // JSON 파싱에 실패하면 캐시하지 않고 즉시 에러 발생
      throw new Error(`JSON 파싱 실패: ${parseError.message}`);
    }

    // 데이터 검증 및 보완
    const validatedInfo = validateAndNormalizeMusicInfo(musicInfo, artist, album, track);
    
    // 캐시에 저장
    setCachedData(cacheKey, validatedInfo);
    
    console.log('Gemini API 음악 정보 로딩 완료:', artist, '-', track);
    return validatedInfo;

  } catch (error) {
    if (error.name === 'AbortError') {
      console.log('Gemini API 요청 취소:', artist, '-', track);
      throw error;
    }
    
    console.error('Gemini API 요청 실패:', error);
    console.error('오류 상세:', {
      name: error.name,
      message: error.message,
      stack: error.stack
    });
    
    // CORS 오류인 경우 특별한 메시지
    if (error.message.includes('CORS') || error.message.includes('fetch')) {
      console.log('CORS 오류 감지됨. 프록시 사용을 고려해보세요.');
    }
    
    // 오류 발생 시 기본 구조 반환
    return createFallbackMusicInfo(artist, album, track, error.message);
  }
}

/**
 * 기본 음악 정보 구조 생성 (오류 발생 시)
 * @param {string} artist - 아티스트 이름
 * @param {string} album - 앨범 이름
 * @param {string} track - 트랙 이름
 * @param {string} errorMessage - 오류 메시지 (선택사항)
 * @returns {Object} 기본 음악 정보 객체
 */
function createFallbackMusicInfo(artist, album, track, errorMessage = null) {
  return {
    artist: {
      name: artist,
      bio: `${artist}에 대한 정보를 불러오는 중 문제가 발생했습니다.`,
      genre: '알 수 없음',
      country: '알 수 없음',
      activeYears: '알 수 없음'
    },
    album: {
      name: album,
      releaseDate: '알 수 없음',
      description: `${album} 앨범에 대한 정보를 불러오는 중 문제가 발생했습니다.`,
      tracks: 0,
      duration: '0:00',
      label: '알 수 없음'
    },
    track: {
      name: track,
      duration: '0:00',
      trackNumber: 0,
      themes: '알 수 없음'
    },
    recommendations: [],
    funFacts: [],
    error: errorMessage,
    isFromCache: false
  };
}

/**
 * 음악 정보 데이터 검증 및 정규화
 * @param {Object} info - 원본 음악 정보
 * @param {string} artist - 아티스트 이름
 * @param {string} album - 앨범 이름
 * @param {string} track - 트랙 이름
 * @returns {Object} 검증된 음악 정보 객체
 */
function validateAndNormalizeMusicInfo(info, artist, album, track) {
  // 기본 구조 확인 및 보완
  const validated = {
    artist: {
      name: info.artist?.name || artist,
      bio: info.artist?.bio || `${artist}에 대한 정보입니다.`,
      genre: info.artist?.genre || '일반',
      country: info.artist?.country || '알 수 없음',
      activeYears: info.artist?.activeYears || '알 수 없음'
    },
    album: {
      name: info.album?.name || album,
      releaseDate: info.album?.releaseDate || '알 수 없음',
      description: info.album?.description || `${album} 앨범에 대한 정보입니다.`,
      tracks: info.album?.tracks || 0,
      duration: info.album?.duration || '0:00',
      label: info.album?.label || '알 수 없음'
    },
    track: {
      name: info.track?.name || track,
      duration: info.track?.duration || '3:30',
      trackNumber: info.track?.trackNumber || 1,
      themes: info.track?.themes || '음악적 표현'
    },
    recommendations: Array.isArray(info.recommendations) ? 
      info.recommendations.slice(0, 3).map(rec => ({
        artist: rec.artist || '추천 아티스트',
        track: rec.track || '추천 곡',
        reason: rec.reason || '유사한 스타일'
      })) : [],
    funFacts: Array.isArray(info.funFacts) ? 
      info.funFacts.slice(0, 5) : [],
    error: null,
    isFromCache: false
  };

  return validated;
}

/**
 * 캐시 존재 여부 확인
 * @returns {boolean} 캐시가 있으면 true, 없으면 false
 */
export function hasCachedData() {
  try {
    const keys = Object.keys(localStorage);
    const geminiKeys = keys.filter(key => key.startsWith(CACHE_KEY_PREFIX));
    console.log('🔍 캐시 존재 여부 확인:', { 
      totalKeys: keys.length, 
      geminiKeys: geminiKeys.length,
      geminiKeysList: geminiKeys
    });
    return geminiKeys.length > 0;
  } catch (error) {
    console.error('❌ 캐시 존재 여부 확인 실패:', error);
    return false;
  }
}

/**
 * 모든 캐시된 아이템 정보 반환
 * @returns {Array} 캐시된 항목들의 정보
 */
export function getCacheInfo() {
  try {
    const keys = Object.keys(localStorage);
    const cacheKeys = keys.filter(key => key.startsWith(CACHE_KEY_PREFIX));
    
    return cacheKeys.map(key => {
      const cached = localStorage.getItem(key);
      const { timestamp } = JSON.parse(cached);
      const cleanKey = key.replace(CACHE_KEY_PREFIX, '');
      
      return {
        key: cleanKey,
        timestamp,
        age: Date.now() - timestamp
      };
    });
  } catch (error) {
    return [];
  }
}
