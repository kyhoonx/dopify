import React, { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';
import { Clock, Calendar, Disc, Globe, Wifi, WifiOff, Download, RotateCcw, Trash2, Info } from 'lucide-react';
import { fetchMusicInfoFromGemini, clearCache, hasCachedData, getCachedData } from '../services/geminiApi';

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

const Section = styled.div`
  margin-bottom: ${props => props.theme.spacing.xl};
`;

const SectionTitle = styled.h4`
  font-size: 14px;
  font-weight: 600;
  color: ${props => props.theme.colors.accent};
  margin-bottom: ${props => props.theme.spacing.md};
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const ArtistImage = styled.div`
  width: 100%;
  height: 200px;
  border-radius: ${props => props.theme.borderRadius};
  background: ${props => props.image ? 
    `url(${props.image})` : 
    'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
  };
  background-size: cover;
  background-position: center;
  margin-bottom: ${props => props.theme.spacing.md};
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.3);
`;

const ArtistName = styled.h2`
  font-size: 24px;
  font-weight: 700;
  color: ${props => props.theme.colors.primary};
  margin-bottom: ${props => props.theme.spacing.sm};
  text-align: center;
`;

const ArtistBio = styled.p`
  font-size: 14px;
  line-height: 1.5;
  color: ${props => props.theme.colors.secondary};
  margin-bottom: ${props => props.theme.spacing.md};
`;

const InfoRow = styled.div`
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.sm};
  margin-bottom: ${props => props.theme.spacing.sm};
  font-size: 13px;
`;

const InfoLabel = styled.span`
  color: ${props => props.theme.colors.secondary};
  min-width: 60px;
  display: flex;
  align-items: center;
  gap: 4px;
`;

const InfoValue = styled.span`
  color: ${props => props.theme.colors.primary};
  font-weight: 500;
`;

const AlbumDescription = styled.p`
  font-size: 13px;
  line-height: 1.4;
  color: ${props => props.theme.colors.secondary};
  margin-top: ${props => props.theme.spacing.sm};
`;

const RecommendationList = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${props => props.theme.spacing.xs};
`;

const RecommendationItem = styled.div`
  display: flex;
  flex-direction: column;
  padding: ${props => props.theme.spacing.sm};
  background: rgba(255, 255, 255, 0.03);
  border-radius: ${props => props.theme.borderRadius};
  font-size: 12px;
  gap: 4px;
`;

const RecommendationText = styled.div`
  color: ${props => props.theme.colors.secondary};
`;

const RecommendationReason = styled.div`
  font-size: 10px;
  color: ${props => props.theme.colors.accent};
  font-style: italic;
`;

const FunFactsSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${props => props.theme.spacing.xs};
`;

const FunFact = styled.div`
  padding: ${props => props.theme.spacing.sm};
  background: rgba(255, 255, 255, 0.03);
  border-radius: ${props => props.theme.borderRadius};
  font-size: 12px;
  color: ${props => props.theme.colors.secondary};
  border-left: 3px solid ${props => props.theme.colors.accent};
`;

function MusicInfo({ currentTrack, isOnline, isVisible = true }) {
  const [musicInfo, setMusicInfo] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [hasCache, setHasCache] = useState(false);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('Gemini AI로 음악 정보를 생성하는 중...');
  
  const abortControllerRef = useRef(null);

  // 트랙 변경 시 캐시된 정보 자동 로드 (isVisible 관계없이 항상 실행)
  useEffect(() => {
    console.log('🔄 MusicInfo useEffect 실행:', {
      hasCurrentTrack: !!currentTrack,
      trackInfo: currentTrack ? `${currentTrack.artist} - ${currentTrack.title}` : 'None',
      album: currentTrack?.album
    });
    
    if (currentTrack) {
      const cacheKey = `${currentTrack.artist}_${currentTrack.album}_${currentTrack.title}`.toLowerCase().replace(/[^a-z0-9_]/g, '_');
      console.log('🔑 생성된 캐시 키:', cacheKey);
      
      const cachedData = getCachedData(cacheKey);
      console.log('💾 캐시 조회 결과:', { hasCachedData: !!cachedData, cacheKey });
      
      if (cachedData) {
        console.log('🎯 캐시된 정보 자동 로드:', `${currentTrack.artist} - ${currentTrack.title}`);
        setMusicInfo(cachedData);
        setHasLoadedOnce(true);
        setError(null);
      } else {
        console.log('🔍 캐시 없음, 정보 초기화:', `${currentTrack.artist} - ${currentTrack.title}`);
        setMusicInfo(null);
        setHasLoadedOnce(false);
        setError(null);
      }
      
      const hasAnyCache = hasCachedData();
      console.log('📦 전체 캐시 존재 여부:', hasAnyCache);
      setHasCache(hasAnyCache);
    } else {
      console.log('❌ currentTrack 없음, 상태 초기화');
      setMusicInfo(null);
      setHasLoadedOnce(false);
      setError(null);
      setHasCache(false);
    }
  }, [currentTrack]); // isVisible 의존성 제거

  // 음악 정보 로드 함수
  const loadMusicInfo = async (forceReload = false) => {
    if (!currentTrack || !isOnline) {
      setError('트랙 정보가 없거나 오프라인 상태입니다.');
      return;
    }

    const cacheKey = `${currentTrack.artist}_${currentTrack.album}_${currentTrack.title}`.toLowerCase().replace(/[^a-z0-9_]/g, '_');

    // 이전 요청 취소
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // 새 AbortController 생성
    abortControllerRef.current = new AbortController();

    try {
      setIsLoading(true);
      setError(null);
      setLoadingMessage('Gemini AI로 음악 정보를 생성하는 중...');

      // 강제 새로고침인 경우 해당 트랙의 캐시 삭제
      if (forceReload) {
        clearCache(cacheKey);
      }
      
      // 재시도 메시지를 위한 이벤트 리스너 추가
      const originalConsoleLog = console.log;
      console.log = (...args) => {
        originalConsoleLog.apply(console, args);
        const message = args.join(' ');
        if (message.includes('503 오류 감지됨')) {
          setLoadingMessage(message);
        }
      };
      
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
        console.log('음악 정보 로딩 완료:', currentTrack.title);
      }
      
      // console.log 복원
      console.log = originalConsoleLog;
    } catch (err) {
      if (err.name === 'AbortError') {
        console.log('음악 정보 로딩 취소:', currentTrack.title);
        return;
      }
      
      console.error('음악 정보 로딩 실패:', err);
      console.error('에러 상세 정보:', {
        name: err.name,
        message: err.message,
        stack: err.stack
      });
      setError(err.message || '음악 정보를 불러올 수 없습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  // 캐시 전체 삭제
  const handleClearCache = () => {
    clearCache();
    setHasCache(false);
    setMusicInfo(null);
    setHasLoadedOnce(false);
    console.log('모든 캐시가 삭제되었습니다.');
  };

  // 컴포넌트 언마운트 시 요청 취소
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // 보이지 않을 때는 빈 div 반환하지만 컴포넌트는 마운트 유지
  if (!isVisible) {
    return <div style={{ display: 'none' }} />;
  }

  // 이 useEffect는 제거됨 - 위의 메인 useEffect에서 처리

  // 공통 헤더 렌더링
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
          <ErrorState>
            <p>재생 중인 음악이 없습니다.</p>
          </ErrorState>
        </Content>
      </Container>
    );
  }

  if (!isOnline) {
    return (
      <Container>
        {renderHeader()}
        <Content>
          <ErrorState>
            <WifiOff size={32} style={{ marginBottom: '16px', opacity: 0.5 }} />
            <p>인터넷 연결이 필요합니다.</p>
            <p style={{ fontSize: '12px', marginTop: '8px' }}>
              온라인 상태에서 음악 정보를 확인할 수 있습니다.
            </p>
          </ErrorState>
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
            {loadingMessage.includes('재시도') && (
              <p style={{ fontSize: '10px', marginTop: '4px', color: '#ffa500' }}>
                ⚠️ 서버가 바쁩니다. 잠시만 기다려주세요...
              </p>
            )}
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
            <Button 
              primary 
              onClick={() => loadMusicInfo(false)}
              style={{ marginTop: '16px' }}
            >
              <Download size={12} />
              다시 시도
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
        {/* 아티스트 정보 */}
        <Section>
          <SectionTitle>아티스트</SectionTitle>
          <ArtistName>{musicInfo.artist.name}</ArtistName>
          <ArtistBio>{musicInfo.artist.bio}</ArtistBio>
          
          <InfoRow>
            <InfoLabel><Globe size={12} />장르</InfoLabel>
            <InfoValue>{musicInfo.artist.genre}</InfoValue>
          </InfoRow>
          <InfoRow>
            <InfoLabel><Calendar size={12} />활동기간</InfoLabel>
            <InfoValue>{musicInfo.artist.activeYears}</InfoValue>
          </InfoRow>
          <InfoRow>
            <InfoLabel><Globe size={12} />국가</InfoLabel>
            <InfoValue>{musicInfo.artist.country}</InfoValue>
          </InfoRow>
        </Section>

        {/* 앨범 정보 */}
        <Section>
          <SectionTitle>앨범</SectionTitle>
          <InfoRow>
            <InfoLabel><Disc size={12} />앨범</InfoLabel>
            <InfoValue>{musicInfo.album.name}</InfoValue>
          </InfoRow>
          <InfoRow>
            <InfoLabel><Calendar size={12} />발매일</InfoLabel>
            <InfoValue>{musicInfo.album.releaseDate}</InfoValue>
          </InfoRow>
          <InfoRow>
            <InfoLabel><Clock size={12} />총 재생시간</InfoLabel>
            <InfoValue>{musicInfo.album.duration}</InfoValue>
          </InfoRow>
          <InfoRow>
            <InfoLabel><Disc size={12} />트랙 수</InfoLabel>
            <InfoValue>{musicInfo.album.tracks}곡</InfoValue>
          </InfoRow>
          <InfoRow>
            <InfoLabel><Globe size={12} />레이블</InfoLabel>
            <InfoValue>{musicInfo.album.label}</InfoValue>
          </InfoRow>
          <AlbumDescription>{musicInfo.album.description}</AlbumDescription>
        </Section>

        {/* 트랙 정보 */}
        <Section>
          <SectionTitle>트랙</SectionTitle>
          <InfoRow>
            <InfoLabel><Disc size={12} />곡명</InfoLabel>
            <InfoValue>{musicInfo.track.name}</InfoValue>
          </InfoRow>
          <InfoRow>
            <InfoLabel><Clock size={12} />재생시간</InfoLabel>
            <InfoValue>{musicInfo.track.duration}</InfoValue>
          </InfoRow>
          <InfoRow>
            <InfoLabel><Disc size={12} />트랙 번호</InfoLabel>
            <InfoValue>{musicInfo.track.trackNumber}</InfoValue>
          </InfoRow>
          <AlbumDescription>{musicInfo.track.themes}</AlbumDescription>
        </Section>

        {/* 추천 음악 */}
        {musicInfo.recommendations && musicInfo.recommendations.length > 0 && (
          <Section>
            <SectionTitle>추천 음악</SectionTitle>
            <RecommendationList>
              {musicInfo.recommendations.map((rec, index) => (
                <RecommendationItem key={index}>
                  <RecommendationText>
                    <div style={{ fontWeight: 500, color: '#fff' }}>{rec.track}</div>
                    <div style={{ fontSize: '11px', opacity: 0.8 }}>{rec.artist}</div>
                  </RecommendationText>
                  <RecommendationReason>{rec.reason}</RecommendationReason>
                </RecommendationItem>
              ))}
            </RecommendationList>
          </Section>
        )}

        {/* 재미있는 사실들 */}
        {musicInfo.funFacts && musicInfo.funFacts.length > 0 && (
          <Section>
            <SectionTitle>재미있는 사실</SectionTitle>
            <FunFactsSection>
              {musicInfo.funFacts.map((fact, index) => (
                <FunFact key={index}>
                  {fact}
                </FunFact>
              ))}
            </FunFactsSection>
          </Section>
        )}

        {/* 에러 표시 (데이터는 있지만 에러가 있는 경우) */}
        {error && (
          <Section>
            <AlbumDescription style={{ color: '#ff6b6b', fontSize: '11px' }}>
              ⚠️ {error}
            </AlbumDescription>
          </Section>
        )}
      </Content>
    </Container>
  );
}

export default MusicInfo;
