# 🎵 AI Music Player

미니멀한 디자인의 음악 플레이어에 Google Gemini AI가 제공하는 음악 정보 기능이 추가된 데스크톱 앱입니다.

## ✨ 주요 기능

- **미니멀한 UI**: 앨범 커버 중심의 깔끔한 디자인
- **심플한 시각화**: 음악에 반응하는 라디오 웨이브 애니메이션
- **AI 음악 정보**: Google Gemini API 기반 상세 음악 정보 제공
- **스마트 캐싱**: 24시간 자동 캐시로 API 사용량 최적화
- **자동 로드**: 캐시된 정보 즉시 표시

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

#### 개발 모드 (권장)
```bash
npm run dev
```
- React 앱과 프록시 서버가 동시에 실행됩니다
- 프록시 서버: http://localhost:3001
- React 앱: http://localhost:3000

#### 각각 실행
```bash
# 터미널 1: 프록시 서버
npm run proxy

# 터미널 2: React 앱
npm start

# 터미널 3: Electron 앱
npm run electron-dev
```

#### 독립 실행형 앱
```bash
# 앱 빌드
npm run dist

# 실행 스크립트 (Mac)
./start-music-player.command
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
│   │   ├── MusicInfo.js      # AI 음악 정보 패널
│   │   ├── MusicPlayer.js    # 음악 플레이어
│   │   └── Visualizer.js     # 라디오 웨이브 시각화
│   ├── services/
│   │   └── geminiApi.js      # Gemini API 서비스
│   └── hooks/                # React 커스텀 훅들
├── music/                    # 음악 파일 폴더
├── proxy-server.js           # CORS 프록시 서버
├── .env.example              # 환경변수 예시 파일
└── PROJECT_HISTORY.md        # 개발 히스토리
```

## 🎯 사용법

1. `music/` 폴더에 음악 파일 추가 (MP3, WAV, FLAC, M4A 지원)
2. 애플리케이션 실행
3. 음악 선택 및 재생
4. 우상단 "정보" 토글 버튼으로 AI 음악 정보 패널 활성화
5. 캐시된 곡은 자동으로 정보 표시, 새 곡은 "정보 로드" 버튼 클릭

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

---

*개발 완료: 2025년 9월 15일*  
*AI 기능 추가: 2025년 9월 17일*