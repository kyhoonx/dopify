import React from 'react';
import styled from 'styled-components';
import { Search, Music, User, Album, Heart, FolderOpen, Settings } from 'lucide-react';

const Container = styled.div`
  height: 100%;
  display: flex;
  flex-direction: column;
  background: ${props => props.theme.colors.surface};
`;

const Header = styled.div`
  padding: ${props => props.theme.spacing.lg};
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
`;

const Title = styled.h2`
  font-size: 24px;
  font-weight: 700;
  margin-bottom: ${props => props.theme.spacing.md};
  color: ${props => props.theme.colors.primary};
`;

const SearchContainer = styled.div`
  position: relative;
  margin-bottom: ${props => props.theme.spacing.md};
`;

const SearchInput = styled.input`
  width: 100%;
  padding: ${props => props.theme.spacing.sm} ${props => props.theme.spacing.sm} ${props => props.theme.spacing.sm} 40px;
  background: ${props => props.theme.colors.surfaceLight};
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: ${props => props.theme.borderRadius};
  color: ${props => props.theme.colors.primary};
  font-size: 14px;
  outline: none;
  transition: border-color 0.2s ease;

  &:focus {
    border-color: ${props => props.theme.colors.accent};
  }

  &::placeholder {
    color: ${props => props.theme.colors.secondary};
  }
`;

const SearchIcon = styled(Search)`
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  width: 16px;
  height: 16px;
  color: ${props => props.theme.colors.secondary};
`;

const SortContainer = styled.div`
  display: flex;
  gap: ${props => props.theme.spacing.sm};
`;

const SortButton = styled.button`
  padding: ${props => props.theme.spacing.xs} ${props => props.theme.spacing.sm};
  background: ${props => props.active ? props.theme.colors.accent : 'transparent'};
  border: 1px solid ${props => props.active ? props.theme.colors.accent : 'rgba(255, 255, 255, 0.2)'};
  border-radius: ${props => props.theme.borderRadius};
  color: ${props => props.active ? '#000' : props.theme.colors.secondary};
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 4px;

  &:hover {
    border-color: ${props => props.theme.colors.accent};
    color: ${props => props.active ? '#000' : props.theme.colors.primary};
  }
`;

const TrackList = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: ${props => props.theme.spacing.sm};
`;

const TrackItem = styled.div`
  padding: ${props => props.theme.spacing.sm};
  margin-bottom: ${props => props.theme.spacing.xs};
  border-radius: ${props => props.theme.borderRadius};
  cursor: pointer;
  transition: all 0.2s ease;
  background: ${props => props.isActive ? 'rgba(30, 215, 96, 0.1)' : 'transparent'};
  border-left: 3px solid ${props => props.isActive ? props.theme.colors.accent : 'transparent'};

  &:hover {
    background: ${props => props.isActive ? 'rgba(30, 215, 96, 0.15)' : 'rgba(255, 255, 255, 0.05)'};
  }
`;

const TrackInfo = styled.div`
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.sm};
`;

const AlbumArt = styled.div`
  width: 48px;
  height: 48px;
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
  width: 24px;
  height: 24px;
  color: ${props => props.theme.colors.secondary};
`;

const TrackDetails = styled.div`
  flex: 1;
  min-width: 0;
`;

const TrackTitle = styled.div`
  font-weight: 500;
  color: ${props => props.theme.colors.primary};
  font-size: 14px;
  margin-bottom: 2px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const TrackMeta = styled.div`
  font-size: 12px;
  color: ${props => props.theme.colors.secondary};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const TrackDuration = styled.div`
  font-size: 12px;
  color: ${props => props.theme.colors.secondary};
  margin-left: auto;
  flex-shrink: 0;
`;

const TrackActions = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  margin-left: auto;
  flex-shrink: 0;
`;

const LikeIcon = styled(Heart).withConfig({
  shouldForwardProp: (prop) => prop !== 'liked',
})`
  width: 16px;
  height: 16px;
  color: ${props => props.liked ? '#e91e63' : 'transparent'};
  fill: ${props => props.liked ? '#e91e63' : 'none'};
  stroke: ${props => props.liked ? '#e91e63' : props.theme.colors.secondary};
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    color: #e91e63;
    stroke: #e91e63;
    transform: scale(1.1);
  }
`;

function formatDuration(seconds) {
  if (!seconds || isNaN(seconds)) return '0:00';
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

function MusicLibrary({ 
  musicFiles, 
  currentTrack, 
  onTrackSelect, 
  sortBy, 
  onSortChange, 
  searchQuery, 
  onSearchChange,
  likedTracks,
  onToggleLike,
  onSelectFolder,
  onOpenSettings
}) {
  const getArtworkData = (track) => {
    if (track.artwork && track.artwork.data) {
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

  return (
    <Container>
      <Header>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <Title style={{ marginBottom: 0 }}>라이브러리</Title>
          <div style={{ display: 'flex', gap: '8px' }}>
            <SortButton onClick={onSelectFolder} title="음악 폴더 선택">
              <FolderOpen size={16} />
            </SortButton>
            <SortButton onClick={onOpenSettings} title="API 설정">
              <Settings size={16} />
            </SortButton>
          </div>
        </div>
        
        <SearchContainer>
          <SearchIcon />
          <SearchInput
            type="text"
            placeholder="음악 검색..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </SearchContainer>
        
        <SortContainer>
          <SortButton 
            active={sortBy === 'artist'} 
            onClick={() => onSortChange('artist')}
          >
            <User size={12} />
            아티스트
          </SortButton>
          <SortButton 
            active={sortBy === 'title'} 
            onClick={() => onSortChange('title')}
          >
            <Music size={12} />
            제목
          </SortButton>
          <SortButton 
            active={sortBy === 'album'} 
            onClick={() => onSortChange('album')}
          >
            <Album size={12} />
            앨범
          </SortButton>
          <SortButton 
            active={sortBy === 'liked'} 
            onClick={() => onSortChange('liked')}
          >
            <Heart size={12} />
            좋아요
          </SortButton>
        </SortContainer>
      </Header>
      
      <TrackList>
        {musicFiles.map((track) => (
          <TrackItem
            key={track.id}
            isActive={currentTrack?.id === track.id}
            onClick={() => onTrackSelect(track)}
          >
            <TrackInfo>
              <AlbumArt artwork={getArtworkData(track)}>
                {!getArtworkData(track) && <DefaultArtwork />}
              </AlbumArt>
              
              <TrackDetails>
                <TrackTitle>{track.title}</TrackTitle>
                <TrackMeta>
                  {track.artist} {track.album && track.album !== 'Unknown Album' && `• ${track.album}`}
                </TrackMeta>
              </TrackDetails>
              
              <TrackActions>
                <LikeIcon 
                  liked={likedTracks.has(track.id)}
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleLike(track.id);
                  }}
                  title={likedTracks.has(track.id) ? "좋아요 취소" : "좋아요"}
                />
                <TrackDuration>
                  {formatDuration(track.duration)}
                </TrackDuration>
              </TrackActions>
            </TrackInfo>
          </TrackItem>
        ))}
        
        {musicFiles.length === 0 && (
          <div style={{ 
            textAlign: 'center', 
            padding: '40px 20px', 
            color: '#666',
            fontSize: '14px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '12px'
          }}>
            <p>음악 폴더를 선택해주세요.</p>
            <SortButton onClick={onSelectFolder} style={{ padding: '8px 16px' }}>
              <FolderOpen size={16} />
              폴더 열기
            </SortButton>
          </div>
        )}
      </TrackList>
    </Container>
  );
}

export default MusicLibrary;
