import React, { useRef, useEffect, useState } from 'react';
import styled from 'styled-components';

const Container = styled.div`
  width: 100%;
  height: 100%;
  position: relative;
  background: linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 50%, #121212 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
`;

const AlbumSection = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  z-index: 2;
  position: relative;
`;

const AlbumArtWrapper = styled.div`
  position: relative;
  margin-bottom: 32px;
`;

const AlbumArt = styled.div`
  width: 280px;
  height: 280px;
  border-radius: 16px;
  background: ${props => props.artwork ? 
    `url(data:image/jpeg;base64,${props.artwork})` : 
    'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
  };
  background-size: cover;
  background-position: center;
  box-shadow: 
    0 25px 50px rgba(0, 0, 0, 0.5),
    0 0 0 1px rgba(255, 255, 255, 0.1),
    inset 0 1px 0 rgba(255, 255, 255, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.3s ease;
  transform: ${props => props.isPlaying ? 'scale(1.05)' : 'scale(1)'};
  
  &::before {
    content: '';
    position: absolute;
    inset: -4px;
    background: linear-gradient(45deg, 
      rgba(255, 255, 255, 0.1) 0%, 
      rgba(255, 255, 255, 0.05) 50%, 
      rgba(255, 255, 255, 0.1) 100%
    );
    border-radius: 20px;
    z-index: -1;
    opacity: ${props => props.isPlaying ? 1 : 0};
    transition: opacity 0.3s ease;
  }
`;

const DefaultAlbumIcon = styled.div`
  width: 120px;
  height: 120px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 48px;
  color: rgba(255, 255, 255, 0.6);
`;

const TrackInfo = styled.div`
  text-align: center;
  margin-bottom: 40px;
`;

const TrackTitle = styled.h2`
  font-size: 28px;
  font-weight: 600;
  margin-bottom: 8px;
  color: #ffffff;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
`;

const TrackArtist = styled.p`
  font-size: 16px;
  font-weight: 400;
  color: rgba(255, 255, 255, 0.8);
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
`;

const VisualizerCanvas = styled.canvas`
  position: absolute;
  bottom: 80px;
  left: 50%;
  transform: translateX(-50%);
  width: 320px;
  height: 100px;
  z-index: 1;
`;

const BackgroundWaves = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 0;
  opacity: 0.3;
`;

const Wave = styled.div`
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: ${props => props.height}px;
  background: linear-gradient(90deg, 
    transparent 0%, 
    ${props => props.color} 20%, 
    ${props => props.color} 80%, 
    transparent 100%
  );
  border-radius: 50% 50% 0 0;
  transform: scaleX(${props => props.scale});
  animation: wave ${props => props.duration}s ease-in-out infinite alternate;
  
  @keyframes wave {
    0% { transform: scaleX(${props => props.scale}); }
    100% { transform: scaleX(${props => props.scale * 1.2}); }
  }
`;

function Visualizer({ analyser, isPlaying, currentTrack }) {
  const canvasRef = useRef(null);
  const animationIdRef = useRef(null);
  const audioDataRef = useRef(new Uint8Array(128));
  // 메모리 최적화를 위해 리샘플링 데이터 배열 재사용
  const resampledDataRef = useRef(new Float32Array(50)); // barCount가 50이므로

  // 앨범 아트워크 데이터 추출
  const getArtworkData = (track) => {
    if (track?.artwork && track.artwork.data) {
      const bytes = new Uint8Array(track.artwork.data);
      let binary = '';
      for (let i = 0; i < bytes.byteLength; i++) {
        binary += String.fromCharCode(bytes[i]);
      }
      return btoa(binary);
    }
    return null;
  };

  // 심플한 라디오 웨이브 시각화
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let animationId;

    const resizeCanvas = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * window.devicePixelRatio;
      canvas.height = rect.height * window.devicePixelRatio;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    const animate = () => {
      animationId = requestAnimationFrame(animate);
      
      const width = canvas.width / window.devicePixelRatio;
      const height = canvas.height / window.devicePixelRatio;
      
      // 캔버스 클리어
      ctx.clearRect(0, 0, width, height);
      
      if (!analyser || !isPlaying) {
        // 재생 중이 아닐 때는 잔잔한 기본 웨이브
        drawStaticWave(ctx, width, height);
        return;
      }

      // 오디오 데이터 가져오기
      analyser.getByteFrequencyData(audioDataRef.current);
      
      // 주파수별로 여러 웨이브 그리기
      drawAudioWaves(ctx, width, height, audioDataRef.current);
    };

    const drawStaticWave = (ctx, width, height) => {
      const centerY = height / 2;
      const barCount = 50;
      const barWidth = width / barCount;
      const time = Date.now() * 0.001;
      
      ctx.fillStyle = '#C084FC';
      
      for (let i = 0; i < barCount; i++) {
        const x = i * barWidth + barWidth / 2;
        const baseHeight = 6 + Math.sin(time * 2 + i * 0.3) * 4;
        const barHeight = Math.max(2, baseHeight);
        
        // 세로 바 그리기
        ctx.fillRect(x - 1, centerY - barHeight / 2, 2, barHeight);
      }
    };

    const drawAudioWaves = (ctx, width, height, audioData) => {
      const centerY = height / 2;
      const barCount = 50;
      const barWidth = width / barCount;
      const time = Date.now() * 0.001;
      
      // 오디오 데이터를 더 적은 바로 리샘플링 (메모리 재사용)
      const resampledData = resampledDataRef.current;
      const chunkSize = Math.floor(audioData.length / barCount);
      
      for (let i = 0; i < barCount; i++) {
        let sum = 0;
        const start = i * chunkSize;
        const end = Math.min(start + chunkSize, audioData.length);
        
        for (let j = start; j < end; j++) {
          sum += audioData[j];
        }
        resampledData[i] = sum / chunkSize;
      }
      
      ctx.fillStyle = '#C084FC';
      
      for (let i = 0; i < barCount; i++) {
        const x = i * barWidth + barWidth / 2;
        const audioValue = resampledData[i] / 255;
        
        // 오디오에 반응하는 높이 계산
        const baseHeight = 3;
        const maxHeight = 40;
        const animatedHeight = baseHeight + Math.sin(time * 3 + i * 0.2) * 5;
        const audioHeight = audioValue * maxHeight;
        const finalHeight = Math.max(baseHeight, Math.max(animatedHeight, audioHeight));
        
        // 세로 바 그리기 (이미지와 같은 스타일)
        const barThickness = 2;
        ctx.fillRect(x - barThickness / 2, centerY - finalHeight / 2, barThickness, finalHeight);
      }
    };

    animate();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
    };
  }, [analyser, isPlaying]);

  return (
    <Container>
      {/* 배경 웨이브 */}
      <BackgroundWaves>
        <Wave 
          height={60} 
          color="rgba(192, 132, 252, 0.05)" 
          scale={1.5} 
          duration={8}
        />
        <Wave 
          height={40} 
          color="rgba(192, 132, 252, 0.03)" 
          scale={1.2} 
          duration={12}
        />
        <Wave 
          height={80} 
          color="rgba(192, 132, 252, 0.02)" 
          scale={1.8} 
          duration={15}
        />
      </BackgroundWaves>

      {/* 메인 콘텐츠 */}
      <AlbumSection>
        <AlbumArtWrapper>
          <AlbumArt 
            artwork={getArtworkData(currentTrack)} 
            isPlaying={isPlaying}
          >
            {!getArtworkData(currentTrack) && (
              <DefaultAlbumIcon>
                🎵
              </DefaultAlbumIcon>
            )}
          </AlbumArt>
        </AlbumArtWrapper>
        
        {currentTrack && (
          <TrackInfo>
            <TrackTitle>{currentTrack.title}</TrackTitle>
            <TrackArtist>{currentTrack.artist}</TrackArtist>
          </TrackInfo>
        )}
      </AlbumSection>

      {/* 라디오 웨이브 시각화 */}
      <VisualizerCanvas ref={canvasRef} />
    </Container>
  );
}

export default Visualizer;
