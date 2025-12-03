# 📘 FE-VibeCodeEval  
**AI Vibe Coding Test Evaluator – Frontend**

AI 기반 코딩 테스트 플랫폼의 **User / Admin UI 전체를 담당하는 Frontend Repository**입니다.  
Next.js · Tailwind CSS · shadcn/ui 기반으로 제작되었습니다.

---

## 🔧 Tech Stack

| Category | Tech |
|---------|------|
| Framework | **Next.js 14 (App Router)** |
| Styling | **Tailwind CSS**, shadcn/ui |
| State Management | Zustand |
| Real-time | SSE / WebSocket (예정) |
| Components | Custom UI + shadcn |
| Package Manager | npm / pnpm |

---

## 📂 Folder Structure

/app  
- /admin → 관리자 Dashboard / Results / Logs / Analytics  
- /admin-signup → 관리자 회원가입 페이지  
- /test → 사용자 시험 화면  
- /waiting → 사용자 대기 화면  

/components → UI 컴포넌트 및 페이지별 컴포넌트  
/hooks → 커스텀 훅  
/lib → util 함수  
/public → 정적 파일  
/styles → 글로벌 스타일  

---

## 🚀 Getting Started

### 1. Install dependencies

npm 사용 시:
- npm install

pnpm 사용 시:
- pnpm install

### 2. Run development server

- npm run dev  

App available at:  
👉 http://localhost:3000

---

## 📝 Features Overview

### ✔ User Side
- Entry Code 기반 시험 입장
- 문제 보기 + Code Editor
- AI Assistant (SSE 기반 예정)
- Token / Timer 표시
- 제출 및 결과 확인

### ✔ Admin Side
- Dashboard (실시간 참가자 정보)
- Entry Code 생성·관리
- User 관리
- Server Status
- Problem Management
- Results (참가자별 상세 분석)
- Analytics (Prompt / Performance / Correctness)
- Settings → 계정 정보 / 로그아웃 / 계정 삭제

---

## 🔐 Environment Variables

프로젝트 루트에 `.env.local` 파일을 생성하고, 아래와 같이 설정합니다.  
(백엔드 연동 시 실제 값으로 교체 예정)

- NEXT_PUBLIC_API_URL = 백엔드 API base URL  
- NEXT_PUBLIC_WS_URL = WebSocket URL  

---

## 📦 Build & Deployment

프로덕션 빌드:
- npm run build  

빌드 결과 실행:
- npm start  

---

## 👨‍💻 Contributors

Frontend: **이찬욱 (Chanwook Lee)**  
Backend & AI: 팀원 전체

---

## 📄 License

MIT License  
(필요시 프로젝트 정책에 맞게 변경 가능)
