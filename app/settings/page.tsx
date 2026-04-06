export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">설정</h1>
          <p className="text-gray-500 mt-1">시스템 및 관리자 계정 설정을 관리합니다.</p>
        </div>
      </div>
      <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
        <p className="text-gray-500">설정 페이지가 성공적으로 로드되었습니다.</p>
      </div>
    </div>
  );
}
