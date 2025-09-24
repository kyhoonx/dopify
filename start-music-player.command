#!/bin/bash

# 스크립트가 있는 디렉토리로 이동
cd "$(dirname "$0")"

echo "🎵 음악 플레이어를 시작합니다..."

# 포트 3000에서 실행 중인 프로세스가 있다면 종료
if lsof -Pi :3000 -sTCP:LISTEN -t >/dev/null ; then
    echo "⚠️  포트 3000에서 실행 중인 프로세스를 종료합니다..."
    lsof -ti:3000 | xargs kill -9 2>/dev/null
    sleep 2
fi

# 포트 3001에서 실행 중인 프로세스가 있다면 종료
if lsof -Pi :3001 -sTCP:LISTEN -t >/dev/null ; then
    echo "⚠️  포트 3001에서 실행 중인 프로세스를 종료합니다..."
    lsof -ti:3001 | xargs kill -9 2>/dev/null
    sleep 2
fi

echo "🚀 프록시 서버, React 앱, Electron을 실행합니다..."

# 프록시 서버와 React 앱, Electron을 모두 함께 실행
npm run electron-dev-full

echo "✅ 음악 플레이어가 실행되었습니다!"


