# 🎵 Dopify - AI Music Player

미니멀한 디자인의 Electron 데스크톱 음악 플레이어에 Google Gemini AI가 제공하는 음악 정보 기능이 추가되었습니다.

## ✨ 주요 기능

- **🎨 미니멀한 UI**: 앨범 커버 중심의 깔끔하고 세련된 디자인
- **🌊 심플한 시각화**: 음악에 반응하는 라디오 웨이브 애니메이션
- **🤖 AI 음악 정보**: Google Gemini API 기반 상세 음악 정보 제공
- **💾 스마트 캐싱**: 24시간 자동 캐시로 API 사용량 최적화
- **⚡ 자동 로드**: 캐시된 정보 즉시 표시
- **🎛️ 완벽한 컨트롤**: 재생/일시정지, 이전/다음 곡, 셔플, 반복
- **🔊 정밀 볼륨 조절**: 직관적인 볼륨 슬라이더
- **❤️ 좋아요 기능**: 마음에 드는 곡 북마크
- **🔍 검색 및 정렬**: 제목, 아티스트, 앨범별 검색 및 정렬

## 🚀 설치 및 실행

### 1. 저장소 클론
```bash
git clone <repository-url>
cd music\ frontend
```

### 2. 의존성 설치
```bash
npm install
```

### 3. 환경변수 설정
`.env.example` 파일을 복사하여 `.env` 파일을 생성하고 API 키를 입력하세요:

```bash
cp .env.example .env
```

`.env` 파일을 열어서 다음과 같이 설정:
```env
# Google Cloud Console에서 발급받은 Gemini API 키를 입력
GEMINI_API_KEY=your_actual_api_key_here
REACT_APP_GEMINI_API_KEY=your_actual_api_key_here
```

### 4. 애플리케이션 실행

#### 🚀 한 번에 실행 (권장)
```bash
# Mac/Linux
./start-music-player.command

# 또는 npm 명령어로
npm run electron-dev-full
```
- 프록시 서버, React 앱, Electron 앱이 모두 자동으로 실행됩니다
- 실행 전 기존 프로세스를 자동으로 정리합니다

#### 🔧 개별 실행 (개발용)
```bash
# 터미널 1: 프록시 서버
npm run proxy

# 터미널 2: React 앱
BROWSER=none npm start

# 터미널 3: Electron 앱
npm run electron
```

#### 📦 독립 실행형 앱 빌드
```bash
# 앱 빌드 및 패키징
npm run dist

# 빌드된 앱은 dist/ 폴더에 생성됩니다
```

## 🔑 Google Gemini API 키 발급

1. [Google Cloud Console](https://console.cloud.google.com/)에 접속
2. 새 프로젝트 생성 또는 기존 프로젝트 선택
3. API 및 서비스 > 라이브러리에서 "Generative Language API" 검색 및 활성화
4. API 및 서비스 > 사용자 인증 정보에서 "API 키 만들기"
5. 생성된 API 키를 `.env` 파일에 입력

## 📁 프로젝트 구조

```
music frontend/
├── src/
│   ├── components/
│   │   ├── MusicInfo.js        # AI 음악 정보 패널
│   │   ├── MusicLibrary.js     # 음악 라이브러리 목록
│   │   ├── MusicPlayer.js      # 메인 플레이어 컨테이너
│   │   ├── PlayerControls.js   # 재생 컨트롤 및 볼륨
│   │   ├── ToggleSwitch.js     # 커스텀 토글 스위치
│   │   └── Visualizer.js       # 라디오 웨이브 시각화
│   ├── services/
│   │   └── geminiApi.js        # Gemini API 서비스
│   ├── hooks/
│   │   ├── useMusicInfoSettings.js  # 음악 정보 설정 훅
│   │   └── useNetworkStatus.js      # 네트워크 상태 훅
│   └── App.js                  # 메인 앱 컴포넌트
├── public/
│   ├── electron.js             # Electron 메인 프로세스
│   ├── preload.js              # Electron 프리로드 스크립트
│   └── index.html              # HTML 템플릿
├── music/                      # 음악 파일 폴더
├── proxy-server.js             # CORS 프록시 서버
├── start-music-player.command  # 앱 실행 스크립트
├── .env.example                # 환경변수 예시 파일
└── PROJECT_HISTORY.md          # 개발 히스토리
```

## 🎯 사용법

1. **음악 파일 추가**: `music/` 폴더에 음악 파일 추가 (MP3, WAV, FLAC, M4A 지원)
2. **앱 실행**: `./start-music-player.command` 또는 `npm run electron-dev-full`
3. **음악 재생**: 좌측 라이브러리에서 음악 선택 및 재생
4. **컨트롤 사용**: 
   - 재생/일시정지, 이전/다음 곡 버튼
   - 볼륨 조절 슬라이더
   - 셔플/반복 모드 토글
   - 좋아요 버튼으로 즐겨찾기 추가
5. **AI 정보 활용**: 우상단 "정보" 토글로 AI 음악 정보 패널 활성화
   - 캐시된 곡은 자동으로 정보 표시
   - 새 곡은 "정보 로드" 버튼 클릭
6. **검색 및 정렬**: 상단 검색바와 정렬 옵션 활용

## ⚠️ 주의사항

- `.env` 파일은 Git에 커밋되지 않습니다 (API 키 보안)
- Gemini API는 사용량에 따라 과금될 수 있습니다
- 네트워크 연결이 필요합니다 (음악 정보 기능)

## 🛠 기술 스택

- **Frontend**: React 18.2.0, Styled Components
- **Desktop**: Electron 24.0.0
- **AI**: Google Gemini 1.5 Flash API
- **Proxy**: Express.js + Axios
- **Audio**: Web Audio API, music-metadata
- **Cache**: localStorage (24시간 TTL)

## 📝 라이선스

이 프로젝트는 개인 사용 목적으로 제작되었습니다.

## 🎮 단축키

- **F12** 또는 **Cmd+Option+I**: 개발자 도구 토글
- **스페이스바**: 재생/일시정지 (곧 추가 예정)

## 📈 최근 업데이트

### v1.2.0 (2025-09-24)
- 🐛 개발자 도구 자동 열림 비활성화
- 🎛️ 볼륨 슬라이더 핸들 위치 정확도 개선
- 🚀 `start-music-player.command` 스크립트 안정성 향상
- 📱 전체적인 UI/UX 개선

### v1.1.0 (2025-09-17)
- 🤖 Google Gemini AI 음악 정보 기능 추가
- 💾 스마트 캐싱 시스템 구현
- 🔍 검색 및 정렬 기능 추가
- ❤️ 좋아요 기능 추가

### v1.0.0 (2025-09-15)
- 🎵 기본 음악 플레이어 기능 구현
- 🌊 라디오 웨이브 시각화 추가
- 📱 Electron 데스크톱 앱 구조 완성

---

*Made with ❤️ using React, Electron & Google Gemini AI*