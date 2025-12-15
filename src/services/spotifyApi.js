/**
 * Spotify API 서비스
 * 프록시 서버를 통해 Spotify의 고화질 아티스트 이미지 및 정보를 가져옴
 */

const PROXY_SERVER_URL = 'http://localhost:3001/api/spotify/artist-image';

/**
 * Spotify에서 아티스트 정보 가져오기 (이미지, 장르, 팔로워 등)
 * @param {string} artistName - 아티스트 이름
 * @returns {Promise<Object|null>} { imageUrl, genres, followers, popularity }
 */
export async function fetchArtistDataFromSpotify(artistName) {
  try {
    const url = `${PROXY_SERVER_URL}?artist=${encodeURIComponent(artistName)}`;
    const response = await fetch(url);
    
    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.warn(`❌ Spotify 데이터 가져오기 실패 (${artistName}):`, error.message);
    return null;
  }
}

/**
 * 하위 호환성을 위해 이미지 URL만 반환하는 함수 유지
 */
export async function fetchArtistImageFromSpotify(artistName) {
    const data = await fetchArtistDataFromSpotify(artistName);
    return data ? data.imageUrl : null;
}
