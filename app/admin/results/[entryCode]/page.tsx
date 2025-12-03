import { ParticipantListContent } from "@/components/participant-list-content";

interface ResultParticipantsPageProps {
  params: {
    entryCode: string;
  };
}

export default function ResultParticipantsPage({
  params,
}: ResultParticipantsPageProps) {
  const { entryCode } = params;

  return (
    <ParticipantListContent entryCode={decodeURIComponent(entryCode)} />
  );
}
