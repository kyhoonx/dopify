import React, { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';
import { 
  Wifi, 
  WifiOff, 
  Download, 
  RotateCcw, 
  Trash2, 
  ExternalLink,
  Users,
  Newspaper,
  Tv,
  Film,
  Youtube
} from 'lucide-react';
import { fetchMusicInfoFromGemini, clearCache, hasCachedData, getCachedData, generateCacheKeyV2 } from '../services/geminiApi';

const Container = styled.div`
  width: 350px;
  height: 100%;
  background: ${props => props.theme.colors.surface};
  border-left: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  flex-direction: column;
  overflow: hidden;
`;

const Header = styled.div`
  padding: ${props => props.theme.spacing.lg};
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  flex-direction: column;
  gap: ${props => props.theme.spacing.sm};
`;

const TitleRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: ${props => props.theme.spacing.sm};
`;

const Title = styled.h3`
  font-size: 18px;
  font-weight: 600;
  color: ${props => props.theme.colors.primary};
  margin: 0;
  flex: 1;
`;

const StatusIndicator = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: ${props => props.online ? props.theme.colors.accent : props.theme.colors.secondary};
`;

const ControlRow = styled.div`
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.sm};
`;

const Button = styled.button`
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 6px 10px;
  background: ${props => props.primary ? props.theme.colors.accent : 'rgba(255, 255, 255, 0.08)'};
  color: ${props => props.primary ? '#000' : props.theme.colors.primary};
  border: 1px solid ${props => props.primary ? 'transparent' : 'rgba(255, 255, 255, 0.1)'};
  border-radius: 16px;
  font-size: 11px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    background: ${props => props.primary ? '#C084FC' : 'rgba(255, 255, 255, 0.12)'};
    border-color: ${props => props.primary ? 'transparent' : 'rgba(255, 255, 255, 0.2)'};
    transform: translateY(-1px);
  }
  
  &:disabled {
    opacity: 0.4;
    cursor: not-allowed;
    transform: none;
  }
`;

const Content = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: ${props => props.theme.spacing.lg};
`;

const Section = styled.div`
  margin-bottom: ${props => props.theme.spacing.xl};
`;

const SectionTitle = styled.h4`
  font-size: 13px;
  font-weight: 600;
  color: ${props => props.theme.colors.accent};
  margin-bottom: ${props => props.theme.spacing.md};
  text-transform: uppercase;
  letter-spacing: 0.5px;
  display: flex;
  align-items: center;
  gap: 6px;
`;

const GroupName = styled.h2`
  font-size: 24px;
  font-weight: 700;
  color: ${props => props.theme.colors.primary};
  margin-bottom: ${props => props.theme.spacing.lg};
`;

const MemberGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
  gap: 12px;
  display: none; /* 멤버 그리드 숨김 처리 */
`;

const ArtistHeroImage = styled.div`
  width: 100%;
  aspect-ratio: 1; /* 정사각형 비율 유지 */
  max-height: 300px; /* 너무 커지지 않게 제한 */
  border-radius: 12px;
  background-color: #2a2a2a;
  background-image: ${props => props.src ? `url(${props.src})` : 'none'};
  background-size: cover;
  background-position: center;
  margin-bottom: ${props => props.theme.spacing.lg};
  box-shadow: 0 4px 12px rgba(0,0,0,0.3);
  position: relative;
  overflow: hidden;

  /* 이미지가 없을 때 대체 텍스트 표시 */
  &::after {
    content: '${props => props.hasImage ? "" : "이미지 없음"}';
    display: ${props => props.hasImage ? "none" : "flex"};
    align-items: center;
    justify-content: center;
    height: 100%;
    color: rgba(255,255,255,0.3);
    font-size: 14px;
  }
`;

const SpotifyInfo = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: -12px;
  margin-bottom: 20px;
`;

const SpotifyTag = styled.span`
  background: rgba(255, 255, 255, 0.1);
  color: ${props => props.theme.colors.primary};
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 12px;
  padding: 4px 10px;
  font-size: 11px;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 4px;
`;

const ArtistDescription = styled.p`
  font-size: 13px;
  color: rgba(255, 255, 255, 0.8);
  line-height: 1.6;
  margin-bottom: 20px;
  white-space: pre-wrap;
`;

// 기존 MemberCard, MemberImage 등은 사용하지 않으므로 무시하거나 삭제해도 됨


const MemberCard = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  transition: transform 0.2s ease;

  &:hover {
    transform: translateY(-2px);
    
    .member-img {
      border-color: ${props => props.theme.colors.accent};
    }
    
    .namu-icon {
      opacity: 1;
    }
  }
`;

const MemberImage = styled.div`
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background-color: #2a2a2a;
  background-image: ${props => props.src ? `url(${props.src})` : 'none'};
  background-size: cover;
  background-position: center;
  border: 2px solid transparent;
  transition: border-color 0.2s ease;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const NamuIcon = styled.div`
  position: absolute;
  bottom: 0;
  right: 0;
  background: #00A495; // 나무위키 색상
  color: white;
  border-radius: 50%;
  padding: 2px;
  width: 16px;
  height: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.2s ease;
  border: 1px solid #1a1a1a;
`;

const MemberName = styled.span`
  font-size: 11px;
  color: ${props => props.theme.colors.secondary};
  text-align: center;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  width: 100%;
`;

const RecentIssueBox = styled.div`
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  padding: 12px;
  font-size: 13px;
  line-height: 1.5;
  color: ${props => props.theme.colors.primary};
  border-left: 3px solid ${props => props.theme.colors.accent};
`;

const MediaList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const MediaItem = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 6px;
  font-size: 12px;
  color: ${props => props.theme.colors.secondary};
`;

const LoadingState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 200px;
  color: ${props => props.theme.colors.secondary};
`;

const LoadingSpinner = styled.div`
  width: 40px;
  height: 40px;
  border: 3px solid rgba(255, 255, 255, 0.1);
  border-top: 3px solid ${props => props.theme.colors.accent};
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: ${props => props.theme.spacing.md};

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

const ErrorState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 200px;
  color: ${props => props.theme.colors.secondary};
  text-align: center;
  padding: ${props => props.theme.spacing.lg};
`;

function MusicInfo({ currentTrack, isOnline, isVisible = true }) {
  const [musicInfo, setMusicInfo] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [hasCache, setHasCache] = useState(false);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('Gemini AI로 음악 정보를 분석 중...');
  
  const abortControllerRef = useRef(null);

  // 컴포넌트 언마운트 시 요청 취소
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // 트랙 변경 시 캐시된 정보 자동 로드
  useEffect(() => {
    if (currentTrack) {
      // 일관된 키 생성을 위해 유틸리티 함수 사용 (V2)
      const cacheKey = generateCacheKeyV2(currentTrack.artist, currentTrack.album, currentTrack.title);
      console.log(`🔍 UI에서 캐시 조회 시도: ${cacheKey}`);
      
      const cachedData = getCachedData(cacheKey);
      
      if (cachedData) {
        console.log('✅ UI: 캐시 데이터 발견!', cachedData.artist.groupName);
        setMusicInfo(cachedData);
        setHasLoadedOnce(true);
        setError(null);
      } else {
        console.log('💨 UI: 캐시 데이터 없음');
        // 이전에 보고 있던 정보가 다른 곡이라면 초기화
        setMusicInfo(null);
        setHasLoadedOnce(false);
        setError(null);
      }
      
      setHasCache(hasCachedData());
    } else {
      setMusicInfo(null);
      setHasLoadedOnce(false);
      setError(null);
      setHasCache(false);
    }
  }, [currentTrack]);

  const loadMusicInfo = async (forceReload = false) => {
    if (!currentTrack || !isOnline) return;

    // V2 키 생성 로직 사용
    const cacheKey = generateCacheKeyV2(currentTrack.artist, currentTrack.album, currentTrack.title);

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    try {
      setIsLoading(true);
      setError(null);
      setLoadingMessage('Gemini AI로 음악 정보를 분석 중...');

      if (forceReload) {
        clearCache(cacheKey);
      }
      
      const info = await fetchMusicInfoFromGemini(
        currentTrack.artist,
        currentTrack.album,
        currentTrack.title,
        abortControllerRef.current.signal
      );

      if (!abortControllerRef.current.signal.aborted) {
        setMusicInfo(info);
        setHasLoadedOnce(true);
        setHasCache(hasCachedData());
      }
    } catch (err) {
      if (err.name !== 'AbortError') {
        setError(err.message || '정보를 불러올 수 없습니다.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearCache = () => {
    clearCache();
    setHasCache(false);
    setMusicInfo(null);
    setHasLoadedOnce(false);
  };

  const handleMemberClick = (keyword) => {
    if (window.electronAPI && window.electronAPI.openExternalLink) {
      const url = `https://namu.wiki/w/${encodeURIComponent(keyword)}`;
      window.electronAPI.openExternalLink(url);
    } else {
      console.warn('External link opening not supported');
    }
  };

  const getMediaIcon = (text) => {
    const lower = text.toLowerCase();
    if (lower.includes('youtube') || lower.includes('유튜브')) return <Youtube size={14} color="#FF0000" />;
    if (lower.includes('movie') || lower.includes('영화')) return <Film size={14} color="#4AB3F4" />;
    if (lower.includes('drama') || lower.includes('드라마') || lower.includes('tv')) return <Tv size={14} color="#FF9900" />;
    return <Users size={14} />;
  };

  // 보이지 않을 때는 빈 div 반환하지만 컴포넌트는 마운트 유지
  if (!isVisible) {
    return <div style={{ display: 'none' }} />;
  }

  const renderHeader = () => (
    <Header>
      <TitleRow>
        <Title>음악 정보</Title>
        <StatusIndicator online={isOnline}>
          {isOnline ? <Wifi size={14} /> : <WifiOff size={14} />}
          {isOnline ? '온라인' : '오프라인'}
        </StatusIndicator>
      </TitleRow>
      
      <ControlRow>
        <Button 
          primary 
          onClick={() => loadMusicInfo(musicInfo ? true : false)}
          disabled={!currentTrack || !isOnline || isLoading}
        >
          {musicInfo ? <RotateCcw size={12} /> : <Download size={12} />}
          {musicInfo ? '새로 로드' : '정보 로드'}
        </Button>
        
        <Button 
          onClick={handleClearCache}
          disabled={!hasCache}
        >
          <Trash2 size={12} />
          캐시 삭제
        </Button>
      </ControlRow>
    </Header>
  );

  if (!currentTrack) {
    return (
      <Container>
        {renderHeader()}
        <Content>
          <ErrorState><p>재생 중인 음악이 없습니다.</p></ErrorState>
        </Content>
      </Container>
    );
  }

  if (isLoading) {
    return (
      <Container>
        {renderHeader()}
        <Content>
          <LoadingState>
            <LoadingSpinner />
            <p>{loadingMessage}</p>
            <p style={{ fontSize: '11px', marginTop: '8px', opacity: 0.7 }}>
              {currentTrack.artist} - {currentTrack.title}
            </p>
          </LoadingState>
        </Content>
      </Container>
    );
  }

  if (error && !musicInfo) {
    return (
      <Container>
        {renderHeader()}
        <Content>
          <ErrorState>
            <p>{error}</p>
            <Button primary onClick={() => loadMusicInfo(false)} style={{ marginTop: '16px' }}>
              <Download size={12} /> 다시 시도
            </Button>
          </ErrorState>
        </Content>
      </Container>
    );
  }

  if (!hasLoadedOnce && !musicInfo) {
    return (
      <Container>
        {renderHeader()}
        <Content>
          <ErrorState>
            <Download size={32} style={{ marginBottom: '16px', opacity: 0.5 }} />
            <p>음악 정보를 로드해주세요.</p>
            <p style={{ fontSize: '12px', marginTop: '8px', opacity: 0.7 }}>
              현재 재생 중: {currentTrack.artist} - {currentTrack.title}
            </p>
          </ErrorState>
        </Content>
      </Container>
    );
  }

  return (
    <Container>
      {renderHeader()}
      <Content>
        {/* 아티스트 & 멤버 섹션 */}
        <Section>
          <GroupName>{musicInfo.artist.groupName}</GroupName>
          
          <ArtistHeroImage 
            src={musicInfo.artist.imageUrl} 
            hasImage={!!musicInfo.artist.imageUrl} 
          />
          
          {/* Spotify 추가 정보 표시 */}
          {musicInfo.artist.spotify && musicInfo.artist.spotify.followers > 0 && (
            <SpotifyInfo>
              <SpotifyTag>
                ❤️ {new Intl.NumberFormat('ko-KR', { notation: "compact" }).format(musicInfo.artist.spotify.followers)} 팔로워
              </SpotifyTag>
            </SpotifyInfo>
          )}

          {/* 아티스트 설명 */}
          {musicInfo.artist.description && (
            <ArtistDescription>
              {musicInfo.artist.description}
            </ArtistDescription>
          )}

        </Section>

        {/* 미디어 정보 섹션 */}
        {musicInfo.track.mediaAppearances && musicInfo.track.mediaAppearances.length > 0 && (
          <Section>
            <SectionTitle>
              <Tv size={14} /> 미디어 등장
            </SectionTitle>
            <MediaList>
              {musicInfo.track.mediaAppearances.map((media, idx) => (
                <MediaItem key={idx}>
                  {getMediaIcon(media)}
                  <span>{media}</span>
                </MediaItem>
              ))}
            </MediaList>
          </Section>
        )}

        {/* 최근 이슈 섹션 */}
        <Section>
          <SectionTitle>
            <Newspaper size={14} /> 최근 이슈
          </SectionTitle>
          <RecentIssueBox>
            {musicInfo.artist.recentIssues}
          </RecentIssueBox>
        </Section>
      </Content>
    </Container>
  );
}

export default MusicInfo;
