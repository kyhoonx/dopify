import React, { useState, useEffect } from 'react';
import styled from 'styled-components';

const Overlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.85);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
`;

const ModalContainer = styled.div`
  background: ${props => props.theme.colors.surface};
  padding: 32px;
  border-radius: 16px;
  width: 100%;
  max-width: 480px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.5);
`;

const Title = styled.h2`
  color: ${props => props.theme.colors.primary};
  margin-bottom: 16px;
  font-size: 24px;
  font-weight: 600;
`;

const Description = styled.p`
  color: ${props => props.theme.colors.secondary};
  margin-bottom: 24px;
  line-height: 1.5;
  font-size: 14px;
`;

const Input = styled.input`
  width: 100%;
  padding: 12px 16px;
  background: ${props => props.theme.colors.surfaceLight};
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  color: #fff;
  font-size: 16px;
  margin-bottom: 24px;
  transition: all 0.2s;

  &:focus {
    outline: none;
    border-color: ${props => props.theme.colors.accent};
    background: rgba(255, 255, 255, 0.1);
  }

  &::placeholder {
    color: rgba(255, 255, 255, 0.3);
  }
`;

const Button = styled.button`
  width: 100%;
  padding: 14px;
  background: ${props => props.theme.colors.accent};
  color: #fff;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: opacity 0.2s;

  &:hover {
    opacity: 0.9;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const Link = styled.a`
  color: ${props => props.theme.colors.accent};
  text-decoration: none;
  &:hover {
    text-decoration: underline;
  }
`;

const ApiKeyModal = ({ onSave, onClose }) => {
  const [keys, setKeys] = useState({
    geminiApiKey: '',
    spotifyClientId: '',
    spotifyClientSecret: ''
  });
  const [error, setError] = useState('');

  // 기존 키 불러오기
  useEffect(() => {
    const loadKeys = async () => {
      if (window.electronAPI) {
        const savedKeys = await window.electronAPI.getApiKeys();
        if (savedKeys) {
          setKeys({
            geminiApiKey: savedKeys.geminiApiKey || '',
            spotifyClientId: savedKeys.spotifyClientId || '',
            spotifyClientSecret: savedKeys.spotifyClientSecret || ''
          });
        }
      }
    };
    loadKeys();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setKeys(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!keys.geminiApiKey.trim()) {
      setError('Gemini API Key는 필수입니다.');
      return;
    }
    // Spotify 키는 선택사항일 수도 있지만, 기능 완성을 위해 입력을 유도
    // 일단 저장은 그대로 진행
    onSave(keys);
  };

  return (
    <Overlay>
      <ModalContainer>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <Title style={{ marginBottom: 0 }}>API 설정</Title>
          {onClose && (
            <button 
              onClick={onClose}
              style={{ background: 'none', border: 'none', color: '#666', cursor: 'pointer', fontSize: '20px' }}
            >
              ✕
            </button>
          )}
        </div>
        <Description>
          음악 정보 분석을 위한 Gemini API Key와<br/>
          고화질 앨범 아트를 위한 Spotify API Key가 필요합니다.
        </Description>
        
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: '#b3b3b3' }}>
              Gemini API Key <Link href="https://aistudio.google.com/app/apikey" target="_blank">(발급받기)</Link>
            </label>
            <Input
              type="password"
              name="geminiApiKey"
              placeholder="AIzaSy..."
              value={keys.geminiApiKey}
              onChange={handleChange}
              autoFocus
            />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: '#b3b3b3' }}>
              Spotify Client ID <Link href="https://developer.spotify.com/dashboard" target="_blank">(발급받기)</Link>
            </label>
            <Input
              type="text"
              name="spotifyClientId"
              placeholder="Spotify Client ID"
              value={keys.spotifyClientId}
              onChange={handleChange}
              style={{ marginBottom: '12px' }}
            />
            <Input
              type="password"
              name="spotifyClientSecret"
              placeholder="Spotify Client Secret"
              value={keys.spotifyClientSecret}
              onChange={handleChange}
            />
          </div>

          {error && <p style={{ color: '#ff6b6b', marginBottom: '16px', fontSize: '14px' }}>{error}</p>}

          <Button type="submit" disabled={!keys.geminiApiKey}>
            설정 저장하기
          </Button>
        </form>
      </ModalContainer>
    </Overlay>
  );
};

export default ApiKeyModal;

