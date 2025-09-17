import { useState, useEffect } from 'react';

/**
 * 네트워크 상태 확인
 * @returns {boolean} 온라인 상태 여부
 */
const isOnline = () => {
  return navigator.onLine;
};

/**
 * 네트워크 상태 변경 이벤트 리스너 등록
 * @param {Function} callback - 상태 변경 시 호출될 콜백 함수
 * @returns {Function} 이벤트 리스너 제거 함수
 */
const addNetworkListener = (callback) => {
  const handleOnline = () => callback(true);
  const handleOffline = () => callback(false);

  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);

  // 리스너 제거 함수 반환
  return () => {
    window.removeEventListener('online', handleOnline);
    window.removeEventListener('offline', handleOffline);
  };
};

/**
 * 네트워크 상태를 관리하는 커스텀 훅
 * @returns {Object} 네트워크 상태 정보
 */
export const useNetworkStatus = () => {
  const [isOnlineState, setIsOnlineState] = useState(isOnline());
  const [wasOffline, setWasOffline] = useState(false);

  useEffect(() => {
    // 초기 상태 설정
    setIsOnlineState(isOnline());

    // 네트워크 상태 변경 리스너 등록
    const removeListener = addNetworkListener((online) => {
      console.log(`네트워크 상태 변경: ${online ? '온라인' : '오프라인'}`);
      
      if (!online) {
        setWasOffline(true);
      }
      
      setIsOnlineState(online);
    });

    // 컴포넌트 언마운트 시 리스너 제거
    return removeListener;
  }, []);

  return {
    isOnline: isOnlineState,
    isOffline: !isOnlineState,
    wasOffline, // 한 번이라도 오프라인이었는지 추적
    connectionStatus: isOnlineState ? 'online' : 'offline'
  };
};

