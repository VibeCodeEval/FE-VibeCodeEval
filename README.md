# FE-VibeCodeEval

AI Vibe Coding Test Evaluator – Frontend

AI 기반 코딩 테스트 플랫폼의 User / Admin / Master UI 전체를 담당하는 Frontend Repository입니다.
Next.js · Tailwind CSS · shadcn/ui 기반으로 제작되었고, 실제 시험 환경에서 사용 가능한 화면 구성을 목표로 합니다.

--------------------------------------------------------------------------------
# 🚀 Features

## ✅ User (수험자)
- 로그인 없이 입장 코드(Entry Code), 이름, 전화번호로 시험 입장
- 시험 대기 화면
- 메인 시험 화면
  - 문제 보기 섹션
  - 코드 에디터 섹션
  - AI Assistant 사이드바
  - 시험 타이머 & 토큰 사용량 표시
- 제출 플로우
  - "제출하기" → 제출 확인 모달
  - 시험 시간 00:00:00 도달 시 "시험 시간 종료 모달"
  - 제출 후 "시험 종료 완료 공지 모달"
    - "홈 화면으로 돌아가기" → 로그인 화면으로 이동

--------------------------------------------------------------------------------
## ✅ Admin (관리자)
- Admin 로그인 / 회원가입
- Dashboard
- Entry Code 생성·관리
- User Board (실시간 진행 현황)
- Server Status Panel
- Problem Management
- Results / Logs / Analytics

--------------------------------------------------------------------------------
## ✅ Master (플랫폼 운영자)
- Master Dashboard
- Test Sessions (Active / Completed 필터링)
- Session Detail → 참가자 리스트 & View Detail
- Global Settings
  - 시험 시간 / 토큰 제한
  - Log·Submission 보관 정책(Data Retention)
- Problem Management
  - Active / Draft / Archived
  - 사용 중인 세션 표시
  - 버전 관리
- Platform Logs
  - 시스템 이벤트 타임라인
  - 타입·날짜 필터

--------------------------------------------------------------------------------
# 🧱 Tech Stack

Category        | Tech
----------------|-------------------------
Framework       | Next.js (App Router)
Language        | TypeScript
UI Library      | React, shadcn/ui
Styling         | Tailwind CSS
State Mgmt      | Zustand
Real-time       | WebSocket (STOMP/SockJS) — 시험 상태 수신 구현 완료 (BE 제공)

--------------------------------------------------------------------------------
# 📁 Project Structure

.
├── app/                 # 사용자/관리자/마스터 페이지
├── components/          # UI Content 컴포넌트
├── hooks/               # Custom Hooks
├── public/              # 정적 파일
└── styles/              # Tailwind & Global Styles

--------------------------------------------------------------------------------
# ▶️ Getting Started

pnpm install
pnpm dev
# http://localhost:3000

--------------------------------------------------------------------------------

git add README.md
git commit -m "Update README for user test modals & master UI"
git push origin main

--------------------------------------------------------------------------------
