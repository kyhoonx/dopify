/**
 * Google Gemini API 서비스
 * 음악 정보를 Gemini API를 통해 가져오는 기능
 */

import { fetchArtistImageFromItunes } from './itunesApi';
import { fetchArtistDataFromSpotify } from './spotifyApi';

// 환경변수에서 API 키 로드 (React 앱에서는 REACT_APP_ 접두사 필요)
const GEMINI_API_KEY = process.env.REACT_APP_GEMINI_API_KEY || 'API_KEY_NOT_CONFIGURED';
// 사용 가능한 Gemini 모델들
const GEMINI_MODELS = [
  'gemini-2.0-flash',     // 1순위: 사용자 계정에서 확인된 최신 모델
  'gemini-flash-latest',  // 2순위: 최신 버전 별칭 (Fallback)
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
const CACHE_KEY_PREFIX = 'gemini_music_cache_v5_'; // v5: 키 생성 로직 변경에 따른 초기화
const CACHE_EXPIRY_HOURS = 24 * 7; // 캐시 유효 기간 7일로 연장

/**
 * 캐시 키 생성 유틸리티 (일관된 키 생성을 위해)
 * 중요: 한글 등 특수문자가 포함된 경우 safe 처리가 너무 과격하여 키 충돌이나 불일치 발생 가능성 있음
 * -> encodeURIComponent 등을 활용하여 고유성 보장 강화
 */
export function generateCacheKey(artist, album, track) {
  // null/undefined 안전 처리
  const safeStr = (str) => (str || '').trim().toLowerCase();
  
  // 간단한 치환만으로는 키 충돌 가능성이 있으므로, 좀 더 명확하게 구분
  // 예: encodeURIComponent 사용하여 한글/공백 보존
  const key = `${safeStr(artist)}|${safeStr(album)}|${safeStr(track)}`;
  
  // 로컬 스토리지 키로 쓰기 위해 안전한 형태로 인코딩 (base64 등도 좋지만 간단히)
  // btoa(unicode)는 한글 처리가 까다로우므로 encodeURIComponent 후 특수문자만 치환
  return key.replace(/[^a-z0-9]/g, (c) => str.charCodeAt(0).toString(16));
}

// 실제 사용성을 위해 간단한 해시 함수 대체 (한글 호환성 좋게)
function simpleHash(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return hash.toString(36); // Base36으로 짧게 변환
}

// 개선된 키 생성 함수 (v5)
export function generateCacheKeyV2(artist, album, track) {
  const safeStr = (str) => (str || '').trim().toLowerCase();
  // 아티스트, 앨범, 트랙을 명확히 구분
  return `art_${simpleHash(safeStr(artist))}_alb_${simpleHash(safeStr(album))}_trk_${simpleHash(safeStr(track))}`;
}

/**
 * 캐시에서 데이터 가져오기
 * @param {string} cacheKey - 캐시 키 (generateCacheKeyV2로 생성된 값 권장)
 * @returns {Object|null} 캐시된 데이터 또는 null
 */
export function getCachedData(cacheKey) {
  try {
    const fullCacheKey = CACHE_KEY_PREFIX + cacheKey;
    const cached = localStorage.getItem(fullCacheKey);
    
    if (!cached) return null;

    const { data, timestamp } = JSON.parse(cached);
    const now = Date.now();
    const expiryTime = timestamp + (CACHE_EXPIRY_HOURS * 60 * 60 * 1000);

    if (now > expiryTime) {
      localStorage.removeItem(fullCacheKey);
      return null;
    }

    // 데이터 유효성 검사 (새 스키마 기준)
    if (data && (!data.artist || !data.artist.groupName)) {
      localStorage.removeItem(fullCacheKey);
      return null;
    }

    console.log(`✅ 캐시 HIT [${cacheKey}]:`, data.artist?.groupName);
    return data;
  } catch (error) {
    console.error('❌ 캐시 데이터 읽기 실패:', error);
    // 오류 발생 시 해당 키 삭제 (오염된 데이터 방지)
    try { localStorage.removeItem(CACHE_KEY_PREFIX + cacheKey); } catch(e) {}
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
    console.log('💾 캐시 저장:', data.artist?.groupName);
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
      localStorage.removeItem(fullCacheKey);
      console.log('✅ 캐시 삭제 완료:', cacheKey);
    } else {
      const keys = Object.keys(localStorage);
      const geminiKeys = keys.filter(key => key.startsWith(CACHE_KEY_PREFIX));
      
      geminiKeys.forEach(key => {
        localStorage.removeItem(key);
      });
      console.log('✅ 모든 캐시 삭제 완료');
    }
  } catch (error) {
    console.error('❌ 캐시 클리어 실패:', error);
  }
}

// 이미지 보완 로직 (우선순위: Spotify -> iTunes)
// 이제 멤버별 이미지가 아니라 아티스트(그룹) 대표 이미지 하나만 찾습니다.
async function fillArtistImages(musicInfo) {
  try {
    console.log('🖼️ 아티스트 대표 이미지 검색 시도...');
    
    const artistName = musicInfo.artist.groupName;
    if (!artistName) return musicInfo;

    let imageUrl = null;
    let spotifyData = null;

    // 1차: Spotify (가장 고품질 & 공식 이미지 + 추가 정보)
    if (!imageUrl) {
        console.log('Spotify 시도...');
        spotifyData = await fetchArtistDataFromSpotify(artistName);
        if (spotifyData && spotifyData.imageUrl) {
            imageUrl = spotifyData.imageUrl;
            console.log('✅ 이미지 소스: Spotify');
            
            // Spotify 추가 정보 주입
            if (!musicInfo.artist.spotify) {
                musicInfo.artist.spotify = {
                    genres: spotifyData.genres || [],
                    followers: spotifyData.followers || 0,
                    popularity: spotifyData.popularity || 0,
                    url: spotifyData.url
                };
            }
        }
    }

    // 2차: iTunes (앨범 아트/MV 썸네일)
    if (!imageUrl) {
        console.log('💨 Spotify 실패. iTunes 시도...');
        imageUrl = await fetchArtistImageFromItunes(artistName);
        if (imageUrl) console.log('✅ 이미지 소스: iTunes');
    }

    if (imageUrl) {
        // 찾은 이미지를 아티스트 객체에 저장 (UI에서 이 필드를 사용하여 크게 표시)
        musicInfo.artist.imageUrl = imageUrl;
    } else {
        console.log('❌ 모든 소스에서 이미지 찾기 실패');
    }

    // 멤버별 이미지 검색 로직은 제거 (사용자 요청: 멤버별 표시 불필요)
    // 기존 members 배열은 텍스트 정보 표시용으로 남겨둠

  } catch (imageError) {
    console.warn('⚠️ 이미지 보완 로직 실패:', imageError);
  }
  return musicInfo;
}

/**
 * 단일 모델로 Gemini API 호출 (재시도 로직 제거)
 */
async function fetchMusicInfoWithRetry(artist, album, track, signal) {
  try {
    // 1.5 flash 모델 시도
    currentModelIndex = 0;
    return await fetchMusicInfoFromGeminiInternal(artist, album, track, signal);
  } catch (error) {
    if (error.name === 'AbortError') {
      throw error;
    }

    console.error(`1차 모델(${GEMINI_MODELS[0]}) 실패:`, error.message);
    
    // 2차 시도: gemini-pro (fallback)
    try {
        currentModelIndex = 1; // gemini-pro
        console.log(`🔄 모델 변경 후 재시도: ${GEMINI_MODELS[1]}`);
        return await fetchMusicInfoFromGeminiInternal(artist, album, track, signal);
    } catch (retryError) {
        console.error(`2차 모델(${GEMINI_MODELS[1]}) 실패:`, retryError.message);
        
        // 모든 API 실패 시 Fallback 정보 생성 후 이미지라도 채우기 시도
        const fallbackInfo = createFallbackMusicInfo(artist, album, track, retryError.message);
        const finalFallbackInfo = await fillArtistImages(fallbackInfo);
        
        // 중요: Fallback 정보라도 이미지가 있다면 캐시에 저장하여 반복적인 API 실패 방지
        const cacheKey = generateCacheKeyV2(artist, album, track);
        setCachedData(cacheKey, finalFallbackInfo);
        
        return finalFallbackInfo;
    }
  }
}

/**
 * Gemini API를 사용하여 음악 정보 생성 (외부 인터페이스)
 */
export async function fetchMusicInfoFromGemini(artist, album, track, signal) {
  return await fetchMusicInfoWithRetry(artist, album, track, signal);
}

/**
 * 실제 Gemini API 호출 로직 (내부 함수) - 프롬프트 전면 수정
 */
async function fetchMusicInfoFromGeminiInternal(artist, album, track, signal) {
  const cacheKey = generateCacheKeyV2(artist, album, track);
  
  // API 키 미설정 시 경고 (단, 프록시 서버에 설정되어 있을 수 있으므로 차단하진 않음)
  if (GEMINI_API_KEY.includes('NOT_CONFIGURED')) {
    console.warn('⚠️ 클라이언트 측 Gemini API 키가 설정되지 않았습니다. 프록시 서버 설정을 확인하세요.');
  }
  
  const cachedData = getCachedData(cacheKey);
  if (cachedData) {
    console.log('🚀 메모리/스토리지 캐시 즉시 반환');
    return cachedData;
  }

  console.log('🌐 Gemini API로 음악 정보 요청 시작:', artist, '-', track);

  const prompt = `
다음 음악에 대한 정보를 시각적이고 맥락적인 데이터 위주로 제공해주세요. 
백과사전식 정보(장르, 데뷔일 등)보다는 멤버 정보와 미디어 등장 배경이 중요합니다.

아티스트: ${artist}
앨범: ${album}
트랙: ${track}

반드시 다음 JSON 스키마를 따라주세요:
{
  "artist": {
    "groupName": "그룹명 또는 아티스트명",
    "description": "아티스트에 대한 간략한 소개 (음악 스타일, 영향력 등 핵심 위주 1~2문장)",
    "members": [
      {
        "name": "멤버 이름",
        "imageUrl": null,
        "namuWikiKeyword": "나무위키 검색 키워드 (예: G-Dragon, 뉴진스, 민지(NewJeans)) - 동명이인 구분을 위해 정확히"
      }
    ],
    "recentIssues": "최근 아티스트 관련 뉴스, 컴백, 이슈 요약 (한국어 1~2문장)"
  },
  "track": {
    "mediaAppearances": [
      "이 곡이 사용된 매체 정보 (예: 영화 '인셉션' OST, 드라마 '도깨비' BGM, 유튜브 쇼츠 챌린지 등)"
    ]
  }
}

주의사항:
1. "imageUrl" 필드는 반드시 null로 설정하세요. (이미지는 별도 API로 가져옵니다)
2. JSON 외의 다른 텍스트는 포함하지 마세요.
`;

  try {
    const requestBody = {
      contents: [{
        parts: [{
          text: prompt
        }]
      }]
    };

    let response;

    if (USE_PROXY) {
      const proxyRequestBody = {
        apiKey: GEMINI_API_KEY,
        requestBody: requestBody,
        model: GEMINI_MODELS[currentModelIndex]
      };

      response = await fetch(PROXY_SERVER_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(proxyRequestBody),
        signal
      });
    } else {
      const apiUrl = getGeminiApiUrl();
      response = await fetch(`${apiUrl}?key=${GEMINI_API_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
        signal
      });
    }

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API 요청 실패: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const data = await response.json();
    
    if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
      throw new Error('API 응답 형식이 올바르지 않습니다.');
    }

    const generatedText = data.candidates[0].content.parts[0].text;
    
    // JSON 파싱
    let musicInfo;
    try {
      let cleanedText = generatedText.trim();
      if (cleanedText.startsWith('```json')) {
        cleanedText = cleanedText.replace(/^```json\s*/, '').replace(/\s*```$/, '');
      } else if (cleanedText.startsWith('```')) {
        cleanedText = cleanedText.replace(/^```\s*/, '').replace(/\s*```$/, '');
      }
      musicInfo = JSON.parse(cleanedText);
    } catch (parseError) {
      throw new Error(`JSON 파싱 실패: ${parseError.message}`);
    }

    // 데이터 검증 및 보완
    const validatedInfo = validateAndNormalizeMusicInfo(musicInfo, artist, track);

    // Last.fm 이미지 보완
    await fillArtistImages(validatedInfo);
    
    // 캐시에 저장
    setCachedData(cacheKey, validatedInfo);
    
    return validatedInfo;

  } catch (error) {
    if (error.name === 'AbortError') {
      throw error;
    }
    // 상위로 에러 전파
    throw error;
  }
}

/**
 * 기본 음악 정보 구조 생성 (오류 발생 시)
 */
function createFallbackMusicInfo(artist, album, track, errorMessage = null) {
  return {
    artist: {
      groupName: artist,
      description: "정보를 불러올 수 없습니다.",
      members: [],
      recentIssues: "정보를 불러올 수 없습니다."
    },
    track: {
      mediaAppearances: []
    },
    error: errorMessage
  };
}

/**
 * 음악 정보 데이터 검증 및 정규화
 */
function validateAndNormalizeMusicInfo(info, artistName, trackName) {
  // 기본 구조 확인 및 보완
  const validated = {
    artist: {
      groupName: info.artist?.groupName || artistName,
      description: info.artist?.description || "아티스트 설명이 없습니다.",
      members: Array.isArray(info.artist?.members) ? info.artist.members.map(m => {
        if (!m) return { name: 'Unknown', imageUrl: null, namuWikiKeyword: artistName };
        return {
          name: m.name || 'Unknown',
          imageUrl: m.imageUrl || null,
          namuWikiKeyword: m.namuWikiKeyword || m.name || artistName
        };
      }) : [],
      recentIssues: info.artist?.recentIssues || "최근 이슈가 없습니다."
    },
    track: {
      mediaAppearances: Array.isArray(info.track?.mediaAppearances) 
        ? info.track.mediaAppearances 
        : []
    }
  };

  return validated;
}

/**
 * 캐시 존재 여부 확인
 */
export function hasCachedData() {
  try {
    const keys = Object.keys(localStorage);
    const geminiKeys = keys.filter(key => key.startsWith(CACHE_KEY_PREFIX));
    return geminiKeys.length > 0;
  } catch (error) {
    return false;
  }
}

/**
 * 모든 캐시된 아이템 정보 반환
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
