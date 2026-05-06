import { useState, useCallback } from "react";
import {
  Users,
  CheckCircle2,
  FileDown,
  Search,
  Download,
  Loader2,
  X,
  Building2,
  FileText,
  ChevronDown,
} from "lucide-react";
import JSZip from "jszip";
import { saveAs } from "file-saver";

// ── Mock Data ────────────────────────────────────────────────────────────────
const mockCompanyInfo = {
  nameTh: "บริษัท รุ่ยเหอ เอ็นจิเนียริ่ง จำกัด",
  nameEn: "Ruihe Engineering Co., Ltd.",
  nameZh: "瑞禾工程有限公司",
  taxId: "0205567013629",
};

const getDocs = (empId) => {
  const basePath = import.meta.env?.BASE_URL || '';
  const cleanBasePath = basePath.replace(/\/$/, '');
  return [
    { name: "BT.34", type: "pdf", size: "1.2 MB", url: `${cleanBasePath}/documents/${empId}_BT34.pdf` },
    { name: "BT.36", type: "pdf", size: "1.5 MB", url: `${cleanBasePath}/documents/${empId}_BT36.pdf` },
  ];
};

const employees = [
  { id: "EMP-001", name: "FENG JIANKE", nameZh: "冯 建科", status: "completed", visaExpiry: "29 May 2026 (2026年5月29日)", documents: getDocs("EMP-001") },
  { id: "EMP-002", name: "WANG JIANFENG", nameZh: "王 建丰", status: "completed", visaExpiry: "29 May 2026 (2026年5月29日)", documents: getDocs("EMP-002") },
  { id: "EMP-003", name: "DU YANSHAN", nameZh: "杜 艳山", status: "completed", visaExpiry: "29 May 2026 (2026年5月29日)", documents: getDocs("EMP-003") },
  { id: "EMP-004", name: "ZHAO GUANGPING", nameZh: "赵 光平", status: "completed", visaExpiry: "24 May 2026 (2026年5月24日)", documents: getDocs("EMP-004") },
  { id: "EMP-005", name: "HAO YAJIE", nameZh: "郝 雅杰", status: "completed", visaExpiry: "24 May 2026 (2026年5月24日)", documents: getDocs("EMP-005") },
  { id: "EMP-006", name: "WEI FACHEN", nameZh: "魏 法臣", status: "completed", visaExpiry: "2 June 2026 (2026年6月2日)", documents: getDocs("EMP-006") },
  { id: "EMP-007", name: "XU KUANGWEI", nameZh: "许 矿伟", status: "completed", visaExpiry: "2 June 2026 (2026年6月2日)", documents: getDocs("EMP-007") },
  { id: "EMP-008", name: "CHEN XIAOMIN", nameZh: "陈 小民", status: "completed", visaExpiry: "2 June 2026 (2026年6月2日)", documents: getDocs("EMP-008") },
  { id: "EMP-009", name: "XU XIANBIN", nameZh: "许 献彬", status: "completed", visaExpiry: "2 June 2026 (2026年6月2日)", documents: getDocs("EMP-009") },
  { id: "EMP-010", name: "REN FEIFEI", nameZh: "任 菲菲", status: "completed", visaExpiry: "2 June 2026 (2026年6月2日)", documents: getDocs("EMP-010") },
  { id: "EMP-011", name: "HAILONG LI", nameZh: "李 海龙", status: "completed", visaExpiry: "30 June 2026 (2026年6月30日)", documents: getDocs("EMP-011") },
  { id: "EMP-012", name: "XIANG WANG", nameZh: "王 响", status: "completed", visaExpiry: "30 June 2026 (2026年6月30日)", documents: getDocs("EMP-012") },
  { id: "EMP-013", name: "FENG WANG", nameZh: "王 峰", status: "completed", visaExpiry: "30 June 2026 (2026年6月30日)", documents: getDocs("EMP-013") },
  { id: "EMP-014", name: "LE LI", nameZh: "李 乐", status: "completed", visaExpiry: "30 June 2026 (2026年6月30日)", documents: getDocs("EMP-014") },
  { id: "EMP-015", name: "JI ZHANG", nameZh: "张 记", status: "completed", visaExpiry: "30 June 2026 (2026年6月30日)", documents: getDocs("EMP-015") },
  { id: "EMP-016", name: "YUANFU LIAO", nameZh: "廖 远福", status: "completed", visaExpiry: "30 June 2026 (2026年6月30日)", documents: getDocs("EMP-016") },
];

const totalEmployees = employees.length;
const completedCount = employees.filter((e) => e.status === "completed").length;
const readyFiles = employees.reduce((sum, e) => sum + e.documents.length, 0);

// ── Toast Component ──────────────────────────────────────────────────────────
function Toast({ toast, onClose }) {
  if (!toast) return null;
  const isError = toast.type === "error";
  return (
    <div className="fixed top-6 right-6 z-50 animate-slide-in">
      <div
        className={`flex items-center gap-3 rounded-lg border px-5 py-3 shadow-lg ${
          isError
            ? "border-red-200 bg-red-50 text-red-800"
            : "border-green-200 bg-green-50 text-green-800"
        }`}
      >
        <span className="text-sm font-medium">{toast.message}</span>
        <button onClick={onClose} className="ml-2 hover:opacity-70">
          <X size={16} />
        </button>
      </div>
    </div>
  );
}

// ── Main App ─────────────────────────────────────────────────────────────────
export default function App() {
  const [search, setSearch] = useState("");
  const [isDownloadingAll, setIsDownloadingAll] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = useCallback((message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  }, []);

  const filtered = employees.filter((emp) =>
    emp.name.toLowerCase().includes(search.toLowerCase())
  );

  // ── Bulk download (zip) ────────────────────────────────────────────────────
  const handleDownloadAll = async () => {
    setIsDownloadingAll(true);
    try {
      const zip = new JSZip();

      for (const emp of employees) {
        const folder = zip.folder(`${emp.id}_${emp.name.replace(/ /g, "_")}`);
        for (const doc of emp.documents) {
          const res = await fetch(doc.url);
          if (!res.ok) throw new Error(`Failed to fetch ${doc.url}`);
          const blob = await res.blob();
          folder.file(doc.url.split("/").pop(), blob);
        }
      }

      const content = await zip.generateAsync({ type: "blob" });
      saveAs(content, "Ruihe_Documents.zip");
      showToast("ดาวน์โหลด Ruihe_Documents.zip สำเร็จ");
    } catch {
      showToast("ไม่สามารถสร้างไฟล์ ZIP ได้ — กรุณาลองอีกครั้ง", "error");
    } finally {
      setIsDownloadingAll(false);
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      {/* Toast */}
      <Toast toast={toast} onClose={() => setToast(null)} />

      {/* Header */}
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center gap-4 px-6 py-5">
          <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-blue-600 text-white">
            <Building2 size={22} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">
              {mockCompanyInfo.nameTh}
              <span className="text-lg font-medium text-slate-500 ml-2">
                ({mockCompanyInfo.nameZh})
              </span>
            </h1>
            <p className="text-sm text-slate-500">
              เลขประจำตัวผู้เสียภาษี: {mockCompanyInfo.taxId}
            </p>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-8">
        {/* Summary Cards */}
        <div className="mb-8 grid gap-5 sm:grid-cols-3">
          <SummaryCard
            icon={<Users size={22} />}
            label="พนักงานทั้งหมด (Total Employees)"
            value={totalEmployees}
            color="blue"
          />
          <SummaryCard
            icon={<CheckCircle2 size={22} />}
            label="ดำเนินการเสร็จสิ้น (Completed)"
            value={completedCount}
            color="green"
          />
          <SummaryCard
            icon={<FileDown size={22} />}
            label="เอกสารพร้อมโหลด (Ready Files)"
            value={readyFiles}
            color="violet"
          />
        </div>

        {/* Action Bar */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:max-w-xs">
            <Search
              size={18}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="text"
              placeholder="ค้นหาชื่อพนักงาน…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white py-2.5 pl-10 pr-4 text-sm shadow-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          <button
            onClick={handleDownloadAll}
            disabled={isDownloadingAll}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:opacity-60"
          >
            {isDownloadingAll ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <Download size={18} />
            )}
            {isDownloadingAll
              ? "กำลังสร้างไฟล์ ZIP…"
              : "ดาวน์โหลดทั้งหมด (.zip)"}
          </button>
        </div>

        {/* Table */}
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase tracking-wider text-slate-500">
                  <th className="px-6 py-3">ชื่อพนักงาน (Employee Name)</th>
                  <th className="px-6 py-3">สถานะ (Status)</th>
                  <th className="px-6 py-3">วันหมดอายุวีซ่า (Visa Expiry / 签证有效期)</th>
                  <th className="px-6 py-3">เอกสารที่ส่งมอบ (Documents)</th>
                  <th className="px-6 py-3 text-right">จัดการ (Action)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-6 py-12 text-center text-slate-400"
                    >
                      ไม่พบพนักงานที่ตรงกับคำค้นหา
                    </td>
                  </tr>
                ) : (
                  filtered.map((emp) => (
                    <tr
                      key={emp.id}
                      className="transition hover:bg-slate-50/60"
                    >
                      {/* Name */}
                      <td className="whitespace-nowrap px-6 py-4">
                        <div className="font-medium text-slate-900">
                          {emp.name}
                        </div>
                        <div className="text-xs text-slate-500">{emp.nameZh}</div>
                        <div className="text-xs text-slate-400">{emp.id}</div>
                      </td>

                      {/* Status */}
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-green-50 px-3 py-1 text-xs font-medium text-green-700">
                          <CheckCircle2 size={14} />
                          เสร็จสิ้น
                        </span>
                      </td>

                      {/* Visa Expiry */}
                      <td className="whitespace-nowrap px-6 py-4 text-slate-600">
                        {emp.visaExpiry}
                      </td>

                      {/* Documents */}
                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                          {emp.documents.map((doc) => (
                            <span
                              key={doc.name}
                              className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700"
                            >
                              <FileText size={13} />
                              {doc.name}
                            </span>
                          ))}
                        </div>
                      </td>

                      {/* Action */}
                      <td className="px-6 py-4">
                        <div className="flex justify-end gap-2">
                          {emp.documents.map((doc) => (
                            <a
                              key={doc.name}
                              href={doc.url}
                              download={`${emp.id}_${doc.name.replace(".", "")}.pdf`}
                              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 no-underline"
                            >
                              <Download size={14} />
                              {doc.name}
                            </a>
                          ))}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Table footer */}
          <div className="border-t border-slate-200 bg-slate-50 px-6 py-3 text-xs text-slate-500">
            แสดง {filtered.length} จาก {totalEmployees} รายการ
          </div>
        </div>
      </main>

      {/* Slide-in animation */}
      <style>{`
        @keyframes slide-in {
          from { opacity: 0; transform: translateX(40px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        .animate-slide-in { animation: slide-in .25s ease-out; }
      `}</style>
    </div>
  );
}

// ── Summary Card ─────────────────────────────────────────────────────────────
const colorMap = {
  blue: "bg-blue-50 text-blue-600",
  green: "bg-green-50 text-green-600",
  violet: "bg-violet-50 text-violet-600",
};

function SummaryCard({ icon, label, value, color }) {
  return (
    <div className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div
        className={`flex h-12 w-12 items-center justify-center rounded-lg ${colorMap[color]}`}
      >
        {icon}
      </div>
      <div>
        <p className="text-sm text-slate-500">{label}</p>
        <p className="text-2xl font-bold text-slate-900">{value}</p>
      </div>
    </div>
  );
}
