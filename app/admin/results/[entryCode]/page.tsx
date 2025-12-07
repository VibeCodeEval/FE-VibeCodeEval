// app/admin/results/[entryCode]/page.tsx

import { ParticipantListContent } from "@/components/participant-list-content";

type ResultParticipantsPageProps = {
  params: {
    entryCode: string;
  };
};

// ⚠️ 맨 위에 "use client" 가 있었다면 삭제해주세요.
// 이 파일은 서버 컴포넌트로 두는게 편합니다.

export default function ResultParticipantsPage({
  params,
}: ResultParticipantsPageProps) {
  // Next.js 동적 세그먼트에서 받은 값
  const rawEntryCode = params?.entryCode ?? "";

  // 혹시 인코딩 되어 있을 수 있으니 decode
  const decodedEntryCode = decodeURIComponent(rawEntryCode);

  return <ParticipantListContent entryCode={decodedEntryCode} />;
}
