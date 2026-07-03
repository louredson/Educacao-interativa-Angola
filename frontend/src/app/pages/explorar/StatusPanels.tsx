import { AlertTriangle, Check, Clock, Flag } from "lucide-react";
import type { AccessRequestInfo, AccessRequestStatus, Content, ReportInfo, ReportStatus } from "./types";

export function AccessStatusPanel({
  content,
  compact = false,
  getAccessInfo,
  getAccessStatusLabel,
  formatDateTime,
}: {
  content: Content;
  compact?: boolean;
  getAccessInfo: (contentId: string) => AccessRequestInfo | undefined;
  getAccessStatusLabel: (status?: AccessRequestStatus) => string;
  formatDateTime: (value?: string | null) => string;
}) {
  const accessInfo = getAccessInfo(content.id);
  if (!accessInfo) return null;

  const isApproved = accessInfo.status === "aprovado";
  const isRejected = accessInfo.status === "rejeitado";

  return (
    <div
      className={`rounded-xl border p-3 text-xs ${
        isApproved
          ? "border-emerald-200 bg-emerald-50 text-emerald-800"
          : isRejected
            ? "border-[#FDD5D5] bg-[#FFF2F2] text-[#5C0016]"
            : "border-orange-200 bg-orange-50 text-orange-800"
      }`}
    >
      <div className="flex items-center gap-2 font-bold">
        {isApproved ? <Check className="w-4 h-4" /> : isRejected ? <AlertTriangle className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
        <span>{getAccessStatusLabel(accessInfo.status)}</span>
      </div>
      <div className={`${compact ? "mt-1" : "mt-2"} space-y-1 text-[11px] font-medium opacity-90`}>
        <p>Pedido: {formatDateTime(accessInfo.requestedAt)}</p>
        {accessInfo.reviewedAt && <p>Revisto: {formatDateTime(accessInfo.reviewedAt)}</p>}
        <p>Responsável: {accessInfo.reviewedBy || (isApproved || isRejected ? "Administração" : "A aguardar equipa")}</p>
        {accessInfo.notes && <p>Observação: {accessInfo.notes}</p>}
      </div>
    </div>
  );
}

export function ReportStatusPanel({
  content,
  getReportInfo,
  getReportStatusLabel,
  formatDateTime,
}: {
  content: Content;
  getReportInfo: (contentId: string) => ReportInfo | undefined;
  getReportStatusLabel: (status?: ReportStatus) => string;
  formatDateTime: (value?: string | null) => string;
}) {
  const reportInfo = getReportInfo(content.id);
  if (!reportInfo) return null;

  return (
    <div className="rounded-xl border border-blue-200 bg-blue-50 p-3 text-xs text-blue-800">
      <div className="flex items-center gap-2 font-bold">
        <Flag className="w-4 h-4" />
        <span>{getReportStatusLabel(reportInfo.status)}</span>
      </div>
      <div className="mt-2 space-y-1 text-[11px] font-medium opacity-90">
        <p>Registada: {formatDateTime(reportInfo.reportedAt)}</p>
        {reportInfo.reviewedAt && <p>Revista: {formatDateTime(reportInfo.reviewedAt)}</p>}
        <p>Responsável: {reportInfo.reviewedBy || "A aguardar moderação"}</p>
        {reportInfo.notes && <p>Observação: {reportInfo.notes}</p>}
      </div>
    </div>
  );
}

export function ReportActionButton({
  content,
  className = "",
  getReportInfo,
  openReportModal,
}: {
  content: Content;
  className?: string;
  getReportInfo: (contentId: string) => ReportInfo | undefined;
  openReportModal: (content: Content) => void;
}) {
  const reportInfo = getReportInfo(content.id);

  return (
    <button
      onClick={() => openReportModal(content)}
      className={`flex items-center gap-2 text-sm transition-colors ${
        reportInfo ? "text-blue-700 font-semibold hover:text-blue-800" : "text-slate-600 hover:text-[#800020]"
      } ${className}`}
    >
      <Flag className="w-5 h-5" />
      <span>{reportInfo ? "Denúncia registada" : "Denunciar"}</span>
    </button>
  );
}
