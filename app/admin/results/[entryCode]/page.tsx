// app/admin/results/[entryCode]/page.tsx
// Next.js 15+ / 16: 동적 라우트의 params는 Promise — 반드시 await 후 사용

import { ParticipantListContent } from "@/components/participant-list-content";

type ResultParticipantsPageProps = {
  params: Promise<{ entryCode: string }>;
};

export default async function ResultParticipantsPage({
  params,
}: ResultParticipantsPageProps) {
  const { entryCode: rawEntryCode } = await params;
  const safe = rawEntryCode ?? "";
  const decodedEntryCode = decodeURIComponent(safe);

  return <ParticipantListContent entryCode={decodedEntryCode} />;
}
