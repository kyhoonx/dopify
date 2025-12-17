/**
 * Spotify API 서비스
 * 프록시 서버를 통해 Spotify의 고화질 아티스트 이미지 및 정보를 가져옴
 */


/**
 * Spotify에서 아티스트 정보 가져오기 (Main Process 경유)
 * @param {string} artistName - 아티스트 이름
 * @returns {Promise<Object|null>} { imageUrl, genres, followers, popularity }
 */
export async function fetchArtistDataFromSpotify(artistName) {
  try {
    if (window.electronAPI) {
      console.log(`Spotify 검색 요청 (Electron): ${artistName}`);
      const data = await window.electronAPI.searchSpotifyArtist(artistName);
      return data;
    }
    return null;
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


