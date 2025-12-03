export function ProblemSection() {
  return (
    <div className="bg-white rounded-xl border border-[#D0D0D0] p-6 flex-shrink-0">
      <h2 className="text-lg font-semibold text-[#1F2937] mb-4">문제 1. 문자열 압축하기</h2>

      <div className="text-[#4B5563] text-sm leading-relaxed mb-6">
        <p className="mb-3">
          문자열을 입력받아 연속으로 반복되는 문자를 숫자와 함께 압축하여 반환하는 함수를 작성하세요.
        </p>
        <p className="mb-3">
          예를 들어, {'"aaabbbccc"'}를 입력하면 {'"a3b3c3"'}을 반환해야 합니다. 만약 압축된 문자열이 원본보다 길다면
          원본 문자열을 그대로 반환하세요.
        </p>
        <p>
          <span className="font-medium text-[#1F2937]">제약 조건:</span> 문자열의 길이는 1 이상 1000 이하이며, 알파벳
          소문자로만 구성됩니다.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Input Example */}
        <div className="bg-[#F9FAFB] rounded-lg border border-[#E5E7EB] p-4">
          <h3 className="text-sm font-medium text-[#1F2937] mb-2">입력 예시</h3>
          <code className="text-sm font-mono text-[#2563EB] bg-[#EFF6FF] px-2 py-1 rounded">"aaabbbccc"</code>
        </div>

        {/* Output Example */}
        <div className="bg-[#F9FAFB] rounded-lg border border-[#E5E7EB] p-4">
          <h3 className="text-sm font-medium text-[#1F2937] mb-2">출력 예시</h3>
          <code className="text-sm font-mono text-[#059669] bg-[#ECFDF5] px-2 py-1 rounded">"a3b3c3"</code>
        </div>
      </div>
    </div>
  )
}
