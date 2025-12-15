import React, { useState, useEffect, useRef, useCallback } from 'react';
import styled, { ThemeProvider, createGlobalStyle } from 'styled-components';
import MusicPlayer from './components/MusicPlayer';
import MusicLibrary from './components/MusicLibrary';
import Visualizer from './components/Visualizer';
import PlayerControls from './components/PlayerControls';
import MusicInfo from './components/MusicInfo';
import ToggleSwitch from './components/ToggleSwitch';
import { useNetworkStatus } from './hooks/useNetworkStatus';
import { useMusicInfoSettings } from './hooks/useMusicInfoSettings';
import { Info } from 'lucide-react';

const GlobalStyle = createGlobalStyle`
  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }

  body {
    font-family: 'Helvetica Neue', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    background: linear-gradient(135deg, #0c0c0c 0%, #1a1a1a 100%);
    color: #ffffff;
    overflow: hidden;
  }

  ::-webkit-scrollbar {
    width: 6px;
  }

  ::-webkit-scrollbar-track {
    background: rgba(255, 255, 255, 0.1);
    border-radius: 3px;
  }

  ::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.3);
    border-radius: 3px;
  }

  ::-webkit-scrollbar-thumb:hover {
    background: rgba(255, 255, 255, 0.5);
  }
`;

const theme = {
  colors: {
    primary: '#ffffff',
    secondary: '#b3b3b3',
    accent: '#C084FC',
    background: '#000000',
    surface: '#181818',
    surfaceLight: '#282828',
  },
  spacing: {
    xs: '4px',
    sm: '8px',
    md: '16px',
    lg: '24px',
    xl: '32px',
  },
  borderRadius: '8px',
};

const AppContainer = styled.div`
  display: flex;
  height: 100vh;
  background: ${props => props.theme.colors.background};
`;

const MainContent = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  position: relative;
`;

const ContentArea = styled.div`
  flex: 1;
  display: flex;
  overflow: hidden;
`;

const LibrarySection = styled.div`
  width: 350px;
  background: ${props => props.theme.colors.surface};
  border-right: 1px solid rgba(255, 255, 255, 0.1);
`;

const VisualizerSection = styled.div`
  flex: 1;
  position: relative;
  background: radial-gradient(circle at center, #0a0a0a 0%, #000000 100%);
  display: flex;
  transition: all 0.3s ease;
`;

const ExpandedVisualizerSection = styled.div`
  flex: 1;
  position: relative;
  background: radial-gradient(circle at center, #0a0a0a 0%, #000000 100%);
  
  .enhanced-album-cover {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    transition: all 0.3s ease;
    z-index: 1;
  }
`;

const InfoToggleContainer = styled.div`
  position: absolute;
  top: ${props => props.theme.spacing.md};
  right: ${props => props.theme.spacing.md};
  z-index: 10;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(6px);
  border-radius: 20px;
  padding: 6px 12px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  transition: all 0.2s ease;
  
  &:hover {
    background: rgba(0, 0, 0, 0.8);
    border-color: rgba(255, 255, 255, 0.2);
  }
`;

const NetworkStatus = styled.div`
  position: absolute;
  bottom: ${props => props.theme.spacing.lg};
  left: ${props => props.theme.spacing.lg};
  z-index: 10;
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(8px);
  border-radius: ${props => props.theme.borderRadius};
  padding: ${props => props.theme.spacing.xs} ${props => props.theme.spacing.sm};
  border: 1px solid rgba(255, 255, 255, 0.1);
  font-size: 12px;
  color: ${props => props.online ? props.theme.colors.accent : props.theme.colors.secondary};
  display: flex;
  align-items: center;
  gap: 4px;
  opacity: ${props => props.show ? 1 : 0};
  transition: opacity 0.3s ease;
`;

const PlayerSection = styled.div`
  height: 90px;
  background: ${props => props.theme.colors.surface};
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  align-items: center;
  padding: 0 ${props => props.theme.spacing.lg};
`;

function App() {
  const [musicFiles, setMusicFiles] = useState([]);
  const [currentTrack, setCurrentTrack] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.7);
  const [shuffle, setShuffle] = useState(false);
  const [repeat, setRepeat] = useState('none'); // 'none', 'one', 'all'
  const [sortBy, setSortBy] = useState('artist'); // 'artist', 'title', 'album', 'liked'
  const [searchQuery, setSearchQuery] = useState('');
  const [likedTracks, setLikedTracks] = useState(new Set());
  const [isMuted, setIsMuted] = useState(false);
  const [previousVolume, setPreviousVolume] = useState(0.7);

  // 새로운 훅들
  const networkStatus = useNetworkStatus();
  const musicInfoSettings = useMusicInfoSettings();
  
  const audioRef = useRef(null);
  const analyserRef = useRef(null);
  const audioContextRef = useRef(null);

  // 좋아요 관련 함수들
  const toggleLike = (trackId) => {
    setLikedTracks(prev => {
      const newLikedTracks = new Set(prev);
      if (newLikedTracks.has(trackId)) {
        newLikedTracks.delete(trackId);
      } else {
        newLikedTracks.add(trackId);
      }
      
      // localStorage에 저장
      localStorage.setItem('likedTracks', JSON.stringify(Array.from(newLikedTracks)));
      return newLikedTracks;
    });
  };

  const isTrackLiked = (trackId) => {
    return likedTracks.has(trackId);
  };

  // localStorage에서 좋아요 데이터 로드
  useEffect(() => {
    const savedLikes = localStorage.getItem('likedTracks');
    if (savedLikes) {
      try {
        const likedArray = JSON.parse(savedLikes);
        setLikedTracks(new Set(likedArray));
      } catch (error) {
        console.error('Error loading liked tracks:', error);
      }
    }
  }, []);

  // 음악 파일 로드
  useEffect(() => {
    const loadMusicFiles = async () => {
      try {
        if (window.electronAPI) {
          const files = await window.electronAPI.getMusicFiles();
          setMusicFiles(files);
          
          // 첫 번째 트랙을 기본 선택
          if (files.length > 0 && !currentTrack) {
            setCurrentTrack(files[0]);
          }

          // 파일 변경 감지 리스너
          window.electronAPI.onMusicFilesUpdated((updatedFiles) => {
            setMusicFiles(updatedFiles);
          });

          // 감시 시작
          await window.electronAPI.startWatching();
        }
      } catch (error) {
        console.error('Error loading music files:', error);
      }
    };

    loadMusicFiles();

    return () => {
      if (window.electronAPI) {
        window.electronAPI.removeAllListeners('music-files-updated');
      }
    };
  }, [currentTrack]);

  // 오디오 분석기 설정
  useEffect(() => {
    if (audioRef.current && !audioContextRef.current) {
      try {
        audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
        analyserRef.current = audioContextRef.current.createAnalyser();
        analyserRef.current.fftSize = 256;
        
        const source = audioContextRef.current.createMediaElementSource(audioRef.current);
        source.connect(analyserRef.current);
        analyserRef.current.connect(audioContextRef.current.destination);
      } catch (error) {
        console.error('Error setting up audio analyzer:', error);
      }
    }
  }, [currentTrack]);

  // 트랙 변경 시 오디오 로드
  useEffect(() => {
    if (currentTrack && audioRef.current) {
      const audio = audioRef.current;
      
      // 기존 재생 중지
      audio.pause();
      setIsPlaying(false);
      setCurrentTime(0);
      
      // 새 트랙 로드
      audio.src = `file://${currentTrack.filePath}`;
      audio.load();
      
      // 로드 완료 후 메타데이터 업데이트
      const handleLoadedData = () => {
        console.log('Track loaded:', currentTrack.title);
        setDuration(audio.duration || 0);
        audio.removeEventListener('loadeddata', handleLoadedData);
      };
      
      audio.addEventListener('loadeddata', handleLoadedData);
    }
  }, [currentTrack]);

  const playTrack = async (track) => {
    const audio = audioRef.current;
    if (!audio) return;
    
    try {
      audio.pause();
      setIsPlaying(false);
      
      if (currentTrack?.id !== track.id) {
        setCurrentTrack(track);
        
        // 새 오디오 소스 설정 및 로드 대기
        await new Promise((resolve) => {
          const handleCanPlay = () => {
            audio.removeEventListener('canplay', handleCanPlay);
            console.log('Track loaded and ready:', track.title);
            resolve();
          };
          
          audio.addEventListener('canplay', handleCanPlay);
          
          // 트랙 변경 useEffect가 실행되도록 잠시 대기
          setTimeout(() => {
            if (audio.readyState >= 2) {
              audio.removeEventListener('canplay', handleCanPlay);
              resolve();
            }
          }, 500);
        });
      }
      
      // 오디오 컨텍스트 재개
      if (audioContextRef.current?.state === 'suspended') {
        await audioContextRef.current.resume();
      }
      
      // 재생 시작
      await audio.play();
      setIsPlaying(true);
      console.log('Now playing:', track.title);
      
    } catch (error) {
      console.error('Error playing track:', track.title, error);
      setIsPlaying(false);
    }
  };

  const pauseTrack = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  };

  const togglePlayPause = async () => {
    if (!currentTrack) {
      // 트랙이 없으면 첫 번째 트랙 재생
      if (musicFiles.length > 0) {
        await playTrack(musicFiles[0]);
      }
      return;
    }
    
    if (isPlaying) {
      pauseTrack();
    } else {
      await playTrack(currentTrack);
    }
  };

  const nextTrack = async () => {
    if (musicFiles.length === 0) return;
    
    const currentIndex = musicFiles.findIndex(track => track.id === currentTrack?.id);
    let nextIndex;
    
    if (shuffle) {
      nextIndex = Math.floor(Math.random() * musicFiles.length);
    } else {
      nextIndex = (currentIndex + 1) % musicFiles.length;
    }
    
    const wasPlaying = isPlaying;
    const nextSong = musicFiles[nextIndex];
    
    if (wasPlaying) {
      await playTrack(nextSong);
    } else {
      setCurrentTrack(nextSong);
    }
  };


  const previousTrack = async () => {
    if (musicFiles.length === 0) return;
    
    const currentIndex = musicFiles.findIndex(track => track.id === currentTrack?.id);
    const prevIndex = currentIndex === 0 ? musicFiles.length - 1 : currentIndex - 1;
    
    const wasPlaying = isPlaying;
    const prevSong = musicFiles[prevIndex];
    
    if (wasPlaying) {
      await playTrack(prevSong);
    } else {
      setCurrentTrack(prevSong);
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };

  const handleEnded = async () => {
    console.log('Track ended, determining next action...');
    
    if (repeat === 'one') {
      // 같은 곡 반복
      audioRef.current.currentTime = 0;
      try {
        await audioRef.current.play();
        console.log('Repeating current track');
      } catch (error) {
        console.error('Error repeating track:', error);
        setIsPlaying(false);
      }
    } else {
      // 다음 곡으로 넘어가기
      const currentIndex = musicFiles.findIndex(track => track.id === currentTrack?.id);
      const isLastTrack = currentIndex === musicFiles.length - 1;
      
      console.log('Current index:', currentIndex, 'Is last track:', isLastTrack, 'Repeat mode:', repeat);
      
      if (repeat === 'all' || !isLastTrack) {
        // 다음 곡 결정
        let nextIndex;
        if (shuffle) {
          nextIndex = Math.floor(Math.random() * musicFiles.length);
        } else {
          nextIndex = (currentIndex + 1) % musicFiles.length;
        }
        
        const nextTrack = musicFiles[nextIndex];
        console.log('Playing next track:', nextTrack.title);
        
        // 직접 다음 곡 재생
        setTimeout(async () => {
          await playTrack(nextTrack);
        }, 100);
      } else {
        // 마지막 곡이고 repeat이 'none'이면 정지
        console.log('End of playlist, stopping playback');
        setIsPlaying(false);
      }
    }
  };

  const seekTo = (time) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const handleVolumeChange = useCallback((newVolume) => {
    setVolume(newVolume);
    setIsMuted(newVolume === 0);
    if (audioRef.current) {
      audioRef.current.volume = newVolume;
    }
  }, []);

  // 단순한 키보드 단축키 (성능 최적화)
  useEffect(() => {
    const handleKeyDown = (e) => {
      // 입력 필드 무시
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

      // 기본 단축키만
      if (e.key === ' ') {
        e.preventDefault();
        togglePlayPause();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [togglePlayPause]);

  // 음악 필터링 및 정렬
  const filteredAndSortedMusic = musicFiles
    .filter(track => {
      // 검색 필터
      const matchesSearch = track.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        track.artist.toLowerCase().includes(searchQuery.toLowerCase()) ||
        track.album.toLowerCase().includes(searchQuery.toLowerCase());
      
      // 좋아요 필터
      const matchesLiked = sortBy === 'liked' ? likedTracks.has(track.id) : true;
      
      return matchesSearch && matchesLiked;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'title':
          return a.title.localeCompare(b.title);
        case 'album':
          return a.album.localeCompare(b.album);
        case 'liked':
          // 좋아요 순 정렬 (좋아요 먼저, 그 다음 아티스트명)
          const aLiked = likedTracks.has(a.id);
          const bLiked = likedTracks.has(b.id);
          if (aLiked && !bLiked) return -1;
          if (!aLiked && bLiked) return 1;
          return a.artist.localeCompare(b.artist);
        case 'artist':
        default:
          return a.artist.localeCompare(b.artist);
      }
    });

  // 음악 정보 패널 표시 여부 결정
  const shouldShowMusicInfo = musicInfoSettings.isInfoPanelEnabled && 
                             networkStatus.isOnline;

  return (
    <ThemeProvider theme={theme}>
      <GlobalStyle />
      <AppContainer>
        <audio
          ref={audioRef}
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onEnded={handleEnded}
          volume={volume}
        />
        
        <MainContent>
          <ContentArea>
            <LibrarySection>
              <MusicLibrary
                musicFiles={filteredAndSortedMusic}
                currentTrack={currentTrack}
                onTrackSelect={playTrack}
                sortBy={sortBy}
                onSortChange={setSortBy}
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                likedTracks={likedTracks}
                onToggleLike={toggleLike}
              />
            </LibrarySection>
            
            <VisualizerSection>
              {/* 네트워크 상태 표시 */}
              <NetworkStatus 
                online={networkStatus.isOnline}
                show={!networkStatus.isOnline || networkStatus.wasOffline}
              >
                {networkStatus.isOnline ? '🟢 온라인' : '🔴 오프라인'}
              </NetworkStatus>

              {/* 메인 시각화 영역 */}
              <Visualizer
                analyser={analyserRef.current}
                isPlaying={isPlaying}
                currentTrack={currentTrack}
              />
            </VisualizerSection>

            {/* 음악 정보 패널 (항상 마운트, 내부에서 표시 제어) */}
            <MusicInfo
              currentTrack={currentTrack}
              isOnline={networkStatus.isOnline}
              isVisible={shouldShowMusicInfo}
            />
          </ContentArea>
          
          <PlayerSection>
            <PlayerControls
              currentTrack={currentTrack}
              isPlaying={isPlaying}
              currentTime={currentTime}
              duration={duration}
              volume={volume}
              shuffle={shuffle}
              repeat={repeat}
              onPlayPause={togglePlayPause}
              onNext={nextTrack}
              onPrevious={previousTrack}
              onSeek={seekTo}
              onVolumeChange={handleVolumeChange}
              onShuffleToggle={() => setShuffle(!shuffle)}
              onRepeatToggle={() => {
                const modes = ['none', 'all', 'one'];
                const currentIndex = modes.indexOf(repeat);
                setRepeat(modes[(currentIndex + 1) % modes.length]);
              }}
              isLiked={currentTrack ? isTrackLiked(currentTrack.id) : false}
              onToggleLike={() => currentTrack && toggleLike(currentTrack.id)}
              showInfoPanel={musicInfoSettings.isInfoPanelEnabled}
              onToggleInfoPanel={musicInfoSettings.toggleInfoPanel}
            />
          </PlayerSection>
        </MainContent>
      </AppContainer>
    </ThemeProvider>
  );
}

export default App;
