# 🎵 Dopify

**미니멀하고 세련된 데스크톱 뮤직 플레이어**

Dopify는 React와 Electron으로 구축된 현대적이고 아름다운 음악 플레이어입니다. 깔끔한 UI와 직관적인 사용자 경험을 제공하여 음악 감상에만 집중할 수 있도록 설계되었습니다.

![Dopify Screenshot](https://via.placeholder.com/800x450/0a0a0a/1ed760?text=Dopify)

## ✨ 주요 기능

### 🎨 **미니멀한 디자인**
- 앨범 커버 중심의 깔끔한 레이아웃
- 다크 테마와 초록색 포인트 컬러
- 부드러운 애니메이션과 트랜지션

### 🌊 **실시간 오디오 시각화**
- 음악에 반응하는 라디오 웨이브
- 50개의 세로 바로 구성된 심플한 스펙트럼
- 재생/일시정지 상태에 따른 동적 애니메이션

### 💖 **좋아요 시스템**
- 개별 트랙 좋아요 기능
- 좋아요한 음악만 필터링
- localStorage 기반 데이터 지속성

### 🎵 **완전한 플레이어 기능**
- 자동 다음 곡 재생
- 셔플 및 반복 재생 모드
- 볼륨 조절 및 진행률 바
- 키보드 단축키 지원

### 📁 **스마트 라이브러리**
- 자동 음악 파일 감지
- 아티스트/제목/앨범/좋아요 순 정렬
- 실시간 검색 기능
- 앨범 아트 자동 표시

## 🚀 설치 및 실행

### 개발 환경 실행

```bash
# 저장소 클론
git clone https://github.com/your-username/dopify.git
cd dopify

# 종속성 설치
npm install

# 개발 서버 실행
npm run electron-dev
```

### 배포판 빌드

```bash
# 프로덕션 빌드
npm run build

# 설치 파일 생성
npm run dist
```

## 📁 프로젝트 구조

```
dopify/
├── src/
│   ├── App.js                 # 메인 앱 컴포넌트
│   ├── components/
│   │   ├── MusicLibrary.js    # 음악 라이브러리
│   │   ├── PlayerControls.js  # 플레이어 컨트롤
│   │   └── Visualizer.js      # 오디오 시각화
│   └── index.js
├── public/
│   ├── electron.js            # Electron 메인 프로세스
│   └── preload.js
├── music/                     # 음악 파일 폴더
└── dist/                      # 빌드된 앱 파일들
```

## 🎵 지원 형식

- **MP3** - 가장 일반적인 형식
- **WAV** - 고품질 무손실
- **FLAC** - 무손실 압축
- **M4A** - Apple 형식

## 🔧 기술 스택

- **Frontend**: React 18.2.0, Styled Components
- **Desktop**: Electron 24.0.0
- **Audio**: Web Audio API, music-metadata
- **Visualization**: HTML5 Canvas
- **Build**: electron-builder

## 🎨 디자인 철학

Dopify는 "음악에만 집중"할 수 있는 환경을 제공합니다:

- **미니멀리즘**: 불필요한 요소 제거, 핵심 기능에 집중
- **직관성**: 복잡한 설명 없이도 쉽게 사용할 수 있는 UI
- **아름다움**: 시각적으로 즐거운 경험 제공
- **성능**: 빠르고 반응성 좋은 인터페이스

## 📝 사용법

1. **음악 추가**: `music` 폴더에 음악 파일을 복사
2. **재생**: 라이브러리에서 곡을 클릭하거나 플레이 버튼 사용
3. **좋아요**: 하트 아이콘을 클릭하여 좋아하는 곡 표시
4. **필터링**: 상단의 칩을 사용하여 정렬 및 필터링

## 🔄 자동 재생 기능

- 한 곡이 끝나면 자동으로 다음 곡 재생
- 반복 모드: 없음 / 전체 반복 / 한 곡 반복
- 셔플 모드: 랜덤 순서로 재생

## 🎯 로드맵

- [ ] 플레이리스트 기능
- [ ] 이퀄라이저
- [ ] 키보드 단축키 커스터마이징
- [ ] 테마 선택 기능
- [ ] 가사 표시
- [ ] 스트리밍 서비스 연동

## 🤝 기여하기

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 라이선스

이 프로젝트는 MIT 라이선스 하에 배포됩니다. 자세한 내용은 `LICENSE` 파일을 참조하세요.

## 🙏 감사의 말

- [React](https://reactjs.org/) - UI 라이브러리
- [Electron](https://www.electronjs.org/) - 데스크톱 앱 프레임워크
- [Styled Components](https://styled-components.com/) - CSS-in-JS
- [Lucide React](https://lucide.dev/) - 아이콘 라이브러리
- [music-metadata](https://github.com/borewit/music-metadata) - 음악 메타데이터 파싱

---

**Dopify**로 더 나은 음악 경험을 즐겨보세요! 🎶