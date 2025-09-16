import React from 'react';
import styled from 'styled-components';

const Container = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
`;

// 이 컴포넌트는 현재 App.js에서 직접 관리되고 있으므로
// 나중에 필요한 경우를 위해 기본 구조만 제공합니다.
function MusicPlayer({ children }) {
  return (
    <Container>
      {children}
    </Container>
  );
}

export default MusicPlayer;


