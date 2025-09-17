import { useState, useEffect } from 'react';

/**
 * 음악 정보 패널 설정을 관리하는 커스텀 훅
 * localStorage를 사용하여 설정을 영구 저장
 */
export const useMusicInfoSettings = () => {
  const [isInfoPanelEnabled, setIsInfoPanelEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // localStorage 키
  const STORAGE_KEY = 'dopify_music_info_enabled';

  // 초기 설정 로드
  useEffect(() => {
    try {
      const savedSetting = localStorage.getItem(STORAGE_KEY);
      if (savedSetting !== null) {
        setIsInfoPanelEnabled(JSON.parse(savedSetting));
      } else {
        // 기본값: 활성화
        setIsInfoPanelEnabled(true);
      }
    } catch (error) {
      console.error('음악 정보 설정 로드 실패:', error);
      setIsInfoPanelEnabled(true); // 기본값으로 설정
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 설정 변경 함수
  const toggleInfoPanel = () => {
    const newValue = !isInfoPanelEnabled;
    setIsInfoPanelEnabled(newValue);
    
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newValue));
      console.log(`음악 정보 패널 ${newValue ? '활성화' : '비활성화'}`);
    } catch (error) {
      console.error('음악 정보 설정 저장 실패:', error);
    }
  };

  // 설정 직접 변경 함수 (고급 사용)
  const setInfoPanelEnabled = (enabled) => {
    setIsInfoPanelEnabled(enabled);
    
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(enabled));
    } catch (error) {
      console.error('음악 정보 설정 저장 실패:', error);
    }
  };

  return {
    isInfoPanelEnabled,
    isLoading,
    toggleInfoPanel,
    setInfoPanelEnabled
  };
};

