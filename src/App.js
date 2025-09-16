import React, { useState, useEffect, useRef } from 'react';
import styled, { ThemeProvider, createGlobalStyle } from 'styled-components';
import MusicPlayer from './components/MusicPlayer';
import MusicLibrary from './components/MusicLibrary';
import Visualizer from './components/Visualizer';
import PlayerControls from './components/PlayerControls';

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
    accent: '#1ed760',
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
    
    console.log('Attempting to play track:', track.title);
    
    try {
      // 현재 재생 중인 오디오 정지
      audio.pause();
      setIsPlaying(false);
      
      // 트랙 변경
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

  const handleVolumeChange = (newVolume) => {
    setVolume(newVolume);
    if (audioRef.current) {
      audioRef.current.volume = newVolume;
    }
  };

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
              <Visualizer
                analyser={analyserRef.current}
                isPlaying={isPlaying}
                currentTrack={currentTrack}
              />
            </VisualizerSection>
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
            />
          </PlayerSection>
        </MainContent>
      </AppContainer>
    </ThemeProvider>
  );
}

export default App;
