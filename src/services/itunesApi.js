/**
 * iTunes Search API 서비스
 * 인증 키 없이 사용 가능하며, 앨범 아트워크, 아티스트 정보, 장르 등을 가져올 수 있음
 */

const ITUNES_API_BASE_URL = 'https://itunes.apple.com/search';

/**
 * iTunes에서 아티스트 정보(이미지 포함) 가져오기
 * @param {string} artistName - 아티스트 이름
 * @returns {Promise<Object|null>} { imageUrl, genre, artistLink } 또는 null
 */
export async function fetchArtistDataFromItunes(artistName) {
  try {
    // 1차 시도: 아티스트(musicArtist)로 검색
    // 아티스트 검색은 정확한 이미지를 주지 않는 경우가 많지만, 있으면 가장 정확함
    const url = `${ITUNES_API_BASE_URL}?term=${encodeURIComponent(artistName)}&entity=musicArtist&limit=1`;
    const response = await fetch(url);
    
    if (!response.ok) {
        throw new Error(`iTunes API Error: ${response.status}`);
    }

    const data = await response.json();
    let result = {
        imageUrl: null,
        genre: null,
        artistLink: null
    };

    if (data.resultCount > 0) {
        const artist = data.results[0];
        result.genre = artist.primaryGenreName;
        result.artistLink = artist.artistLinkUrl;
        
        // 아티스트 직접 이미지는 없지만, 만약 다른 필드에 숨겨진 이미지가 있다면 사용
        // iTunes API 문서상으로는 artist image를 직접 주진 않음. 하지만 일부 데이터에 있을 수 있음.
    }

    // 2차 시도: 앨범(album) 검색 - 앨범 아트워크가 가장 흔한 대안
    const albumUrl = `${ITUNES_API_BASE_URL}?term=${encodeURIComponent(artistName)}&entity=album&limit=1`;
    const albumResponse = await fetch(albumUrl);
    
    if (albumResponse.ok) {
        const albumData = await albumResponse.json();
        if (albumData.resultCount > 0 && albumData.results[0].artworkUrl100) {
            // 100x100 이미지를 1000x1000 고해상도로 변환 (iTunes는 원본 수준 화질 제공 가능)
            result.imageUrl = albumData.results[0].artworkUrl100.replace('100x100bb', '1000x1000bb');
        }
    }

    // 3차 시도: 만약 앨범 아트가 없다면, 뮤직비디오 검색 시도 (가수 얼굴이 나올 확률이 높음)
    if (!result.imageUrl) {
         const mvUrl = `${ITUNES_API_BASE_URL}?term=${encodeURIComponent(artistName)}&entity=musicVideo&limit=1`;
         const mvResponse = await fetch(mvUrl);
         if (mvResponse.ok) {
             const mvData = await mvResponse.json();
             if (mvData.resultCount > 0 && mvData.results[0].artworkUrl100) {
                 result.imageUrl = mvData.results[0].artworkUrl100.replace('100x100bb', '1000x1000bb');
             }
         }
    }
    
    // 이미지가 없으면 null 반환
    if (!result.imageUrl && !result.genre) return null;
    
    return result;
  } catch (error) {
    console.error(`❌ iTunes 데이터 가져오기 실패 (${artistName}):`, error);
    return null;
  }
}

/**
 * 단순히 이미지만 가져오는 헬퍼 함수
 */
export async function fetchArtistImageFromItunes(artistName) {
    const data = await fetchArtistDataFromItunes(artistName);
    return data ? data.imageUrl : null;
}



