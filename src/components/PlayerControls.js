import React from 'react';
import styled from 'styled-components';
import { 
  Play, 
  Pause, 
  SkipBack, 
  SkipForward, 
  Volume2, 
  VolumeX, 
  Shuffle, 
  Repeat, 
  Repeat1,
  Music,
  Heart
} from 'lucide-react';

const Container = styled.div`
  display: flex;
  align-items: center;
  width: 100%;
  gap: ${props => props.theme.spacing.lg};
`;

const TrackInfo = styled.div`
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.sm};
  min-width: 0;
  flex: 1;
`;

const AlbumArt = styled.div`
  width: 56px;
  height: 56px;
  border-radius: 4px;
  background: ${props => props.artwork ? `url(data:image/jpeg;base64,${props.artwork})` : 'linear-gradient(45deg, #333, #666)'};
  background-size: cover;
  background-position: center;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
`;

const DefaultArtwork = styled(Music)`
  width: 28px;
  height: 28px;
  color: ${props => props.theme.colors.secondary};
`;

const TrackDetails = styled.div`
  min-width: 0;
  flex: 1;
`;

const TrackTitle = styled.div`
  font-weight: 600;
  color: ${props => props.theme.colors.primary};
  font-size: 14px;
  margin-bottom: 2px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const TrackArtist = styled.div`
  font-size: 12px;
  color: ${props => props.theme.colors.secondary};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const ControlsSection = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: ${props => props.theme.spacing.sm};
  flex: 2;
`;

const ControlButtons = styled.div`
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.sm};
`;

const ControlButton = styled.button`
  background: none;
  border: none;
  color: ${props => props.active ? props.theme.colors.accent : props.theme.colors.secondary};
  cursor: pointer;
  padding: ${props => props.theme.spacing.xs};
  border-radius: 50%;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;

  &:hover {
    color: ${props => props.theme.colors.primary};
    background: rgba(255, 255, 255, 0.1);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const LikeButton = styled.button`
  background: none;
  border: none;
  color: ${props => props.liked ? '#e91e63' : props.theme.colors.secondary};
  cursor: pointer;
  padding: ${props => props.theme.spacing.xs};
  border-radius: 50%;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-left: ${props => props.theme.spacing.sm};

  &:hover {
    color: ${props => props.liked ? '#c2185b' : '#e91e63'};
    background: rgba(233, 30, 99, 0.1);
    transform: scale(1.1);
  }

  svg {
    fill: ${props => props.liked ? 'currentColor' : 'none'};
  }
`;

const PlayButton = styled(ControlButton)`
  background: ${props => props.theme.colors.accent};
  color: #000;
  width: 40px;
  height: 40px;

  &:hover {
    background: #1fdf64;
    color: #000;
  }
`;

const ProgressSection = styled.div`
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.sm};
  width: 100%;
  max-width: 500px;
`;

const TimeDisplay = styled.span`
  font-size: 11px;
  color: ${props => props.theme.colors.secondary};
  min-width: 40px;
  text-align: center;
`;

const ProgressBar = styled.div`
  flex: 1;
  height: 4px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 2px;
  position: relative;
  cursor: pointer;
  
  &:hover {
    background: rgba(255, 255, 255, 0.2);
  }
`;

const ProgressFill = styled.div`
  height: 100%;
  background: ${props => props.theme.colors.accent};
  border-radius: 2px;
  width: ${props => props.progress}%;
  transition: width 0.1s ease;
`;

const VolumeSection = styled.div`
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.sm};
  flex: 1;
  justify-content: flex-end;
`;

const VolumeBar = styled.div`
  width: 80px;
  height: 4px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 2px;
  position: relative;
  cursor: pointer;
`;

const VolumeFill = styled.div`
  height: 100%;
  background: ${props => props.theme.colors.accent};
  border-radius: 2px;
  width: ${props => props.volume * 100}%;
`;

function formatTime(seconds) {
  if (!seconds || isNaN(seconds)) return '0:00';
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

function PlayerControls({
  currentTrack,
  isPlaying,
  currentTime,
  duration,
  volume,
  shuffle,
  repeat,
  onPlayPause,
  onNext,
  onPrevious,
  onSeek,
  onVolumeChange,
  onShuffleToggle,
  onRepeatToggle,
  isLiked,
  onToggleLike
}) {
  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  const handleProgressClick = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const newProgress = clickX / rect.width;
    const newTime = newProgress * duration;
    onSeek(newTime);
  };

  const handleVolumeClick = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const newVolume = Math.max(0, Math.min(1, clickX / rect.width));
    onVolumeChange(newVolume);
  };

  const getArtworkData = (track) => {
    if (track?.artwork && track.artwork.data) {
      // Uint8Array를 base64로 변환
      const bytes = new Uint8Array(track.artwork.data);
      let binary = '';
      for (let i = 0; i < bytes.byteLength; i++) {
        binary += String.fromCharCode(bytes[i]);
      }
      return btoa(binary);
    }
    return null;
  };

  const RepeatIcon = repeat === 'one' ? Repeat1 : Repeat;

  return (
    <Container>
      <TrackInfo>
        {currentTrack && (
          <>
            <AlbumArt artwork={getArtworkData(currentTrack)}>
              {!getArtworkData(currentTrack) && <DefaultArtwork />}
            </AlbumArt>
            <TrackDetails>
              <TrackTitle>{currentTrack.title}</TrackTitle>
              <TrackArtist>{currentTrack.artist}</TrackArtist>
            </TrackDetails>
            <LikeButton 
              liked={isLiked} 
              onClick={onToggleLike}
              title={isLiked ? "좋아요 취소" : "좋아요"}
            >
              <Heart size={20} />
            </LikeButton>
          </>
        )}
      </TrackInfo>

      <ControlsSection>
        <ControlButtons>
          <ControlButton onClick={onShuffleToggle} active={shuffle}>
            <Shuffle size={16} />
          </ControlButton>
          
          <ControlButton onClick={onPrevious}>
            <SkipBack size={20} />
          </ControlButton>
          
          <PlayButton onClick={onPlayPause} disabled={!currentTrack}>
            {isPlaying ? <Pause size={20} /> : <Play size={20} />}
          </PlayButton>
          
          <ControlButton onClick={onNext}>
            <SkipForward size={20} />
          </ControlButton>
          
          <ControlButton onClick={onRepeatToggle} active={repeat !== 'none'}>
            <RepeatIcon size={16} />
          </ControlButton>
        </ControlButtons>

        <ProgressSection>
          <TimeDisplay>{formatTime(currentTime)}</TimeDisplay>
          <ProgressBar onClick={handleProgressClick}>
            <ProgressFill progress={progress} />
          </ProgressBar>
          <TimeDisplay>{formatTime(duration)}</TimeDisplay>
        </ProgressSection>
      </ControlsSection>

      <VolumeSection>
        <ControlButton onClick={() => onVolumeChange(volume > 0 ? 0 : 0.7)}>
          {volume === 0 ? <VolumeX size={16} /> : <Volume2 size={16} />}
        </ControlButton>
        <VolumeBar onClick={handleVolumeClick}>
          <VolumeFill volume={volume} />
        </VolumeBar>
      </VolumeSection>
    </Container>
  );
}

export default PlayerControls;
