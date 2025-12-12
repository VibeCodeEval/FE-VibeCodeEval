export function ProblemSection() {
  return (
    <div className="bg-white rounded-xl border border-[#D0D0D0] p-6 flex-shrink-0">
      <h2 className="text-lg font-semibold text-[#1F2937] mb-4">문제 1. 외판원 순회</h2>

      <div className="text-[#4B5563] text-sm leading-relaxed mb-6">
        <p className="mb-3">
          1번부터 N번까지 번호가 매겨진 도시들이 있고, 각 도시 쌍 사이의 이동 비용이 주어집니다. 한 도시에서 출발하여 모든 도시를 정확히 한 번씩 방문한 뒤, 다시 출발 도시로 돌아오는 외판원 순회 경로 중 최소 비용을 구하는 프로그램을 작성하세요.
        </p>
        <p className="mb-3">
          이동할 수 없는 경우 비용이 0으로 주어지며, 항상 적어도 하나 이상의 완전한 순회가 존재하는 입력만 주어집니다.
        </p>
        <p>
          <span className="font-medium text-[#1F2937]">제약 조건:</span> 2 ≤ N ≤ 16 이며, 이동 비용은 0 또는 1,000,000 이하의 양의 정수입니다. W[i][j] = 0이면 i에서 j로 이동할 수 없음을 의미합니다.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Input Example */}
        <div className="bg-[#F9FAFB] rounded-lg border border-[#E5E7EB] p-4">
          <h3 className="text-sm font-medium text-[#1F2937] mb-2">입력 예시</h3>
          <code className="text-sm font-mono text-[#2563EB] bg-[#EFF6FF] px-2 py-1 rounded whitespace-pre">{`4
0 10 15 20
5 0 9 10
6 13 0 12
8 8 9 0`}</code>
        </div>

        {/* Output Example */}
        <div className="bg-[#F9FAFB] rounded-lg border border-[#E5E7EB] p-4">
          <h3 className="text-sm font-medium text-[#1F2937] mb-2">출력 예시</h3>
          <code className="text-sm font-mono text-[#059669] bg-[#ECFDF5] px-2 py-1 rounded">35</code>
        </div>
      </div>
    </div>
  )
}
