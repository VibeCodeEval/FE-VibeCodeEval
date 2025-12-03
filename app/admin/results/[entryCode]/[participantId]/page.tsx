import { ParticipantEvaluationContent } from "@/components/participant-evaluation-content";
// 만약 participant-evaluation-content.tsx가 default export라면 위 줄을 이렇게 바꾸세요:
// import ParticipantEvaluationContent from "@/components/ui/participant-evaluation-content";

interface ParticipantEvaluationPageProps {
  params: {
    entryCode: string;
    participantId: string;
  };
}

export default function ParticipantEvaluationPage({
  params,
}: ParticipantEvaluationPageProps) {
  const { entryCode, participantId } = params;

  return (
    <ParticipantEvaluationContent
      entryCode={decodeURIComponent(entryCode)}
      participantId={decodeURIComponent(participantId)}
    />
  );
}
